import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectTaggingCommand,
  S3Client,
  UploadPartCommand,
  AbortMultipartUploadCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ProjectFileKind, ProjectFileStatus, ProjectStatus, UserRole } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.service';

const DEFAULT_MAX_FILE_SIZE_MB = 100;
const MAX_CONFIGURED_FILE_SIZE_MB = 2048;
const PART_SIZE = 16 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  'docx', 'doc', 'pdf', 'xlsx', 'xls', 'csv', 'pptx', 'txt', 'json', 'xml',
  'zip', 'png', 'jpg', 'jpeg', 'webp',
]);
const MAX_PARTS = Math.ceil((MAX_CONFIGURED_FILE_SIZE_MB * 1024 * 1024) / PART_SIZE);
const PROJECT_STATUSES = new Set<string>(Object.values(ProjectStatus));

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  private s3Client: S3Client | undefined;

  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthenticatedUser, input: { serviceType: string; title: string; description: string }) {
    const serviceType = this.requiredText(input?.serviceType, 'Service', 100);
    const title = this.requiredText(input?.title, 'Project title', 160);
    const description = this.requiredText(input?.description, 'Project description', 10000);

    const project = await this.prisma.project.create({
      data: {
        ownerId: user.id,
        serviceType,
        title,
        description,
        activities: { create: { actorId: user.id, action: 'PROJECT_CREATED', detail: title } },
      },
      include: this.projectInclude(),
    });
    return this.publicProject(project);
  }

  async list(user: AuthenticatedUser) {
    const projects = await this.prisma.project.findMany({
      where: user.role === UserRole.SUPER_ADMIN || user.permissions.includes('projects:manage')
        ? {}
        : { ownerId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 200,
      include: this.projectInclude(),
    });
    return projects.map((project) => this.publicProject(project));
  }

  async listStaff() {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { role: UserRole.SUPER_ADMIN },
          { permissions: { has: 'projects:manage' } },
        ],
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
      take: 200,
    });
  }

  async updateStatus(user: AuthenticatedUser, projectId: string, status: string) {
    if (!PROJECT_STATUSES.has(status)) {
      throw new BadRequestException('Choose a valid project status.');
    }
    const project = await this.findProject(projectId);
    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedProject = await tx.project.update({
        where: { id: project.id },
        data: { status: status as ProjectStatus },
        include: this.projectInclude(),
      });
      await tx.projectActivity.create({
        data: { projectId, actorId: user.id, action: 'STATUS_CHANGED', detail: `${project.status} -> ${status}` },
      });
      return updatedProject;
    });
    return this.publicProject(updated);
  }

  async assign(user: AuthenticatedUser, projectId: string, assigneeId: string | null) {
    const project = await this.findProject(projectId);
    if (assigneeId !== null) {
      const assignee = await this.prisma.user.findFirst({
        where: {
          id: assigneeId,
          isActive: true,
          OR: [
            { role: UserRole.SUPER_ADMIN },
            { permissions: { has: 'projects:manage' } },
          ],
        },
        select: { id: true },
      });
      if (!assignee) throw new BadRequestException('Select an active administrator.');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedProject = await tx.project.update({
        where: { id: project.id },
        data: {
          assigneeId,
          status: assigneeId && project.status === ProjectStatus.PENDING
            ? ProjectStatus.ASSIGNED
            : project.status,
        },
        include: this.projectInclude(),
      });
      await tx.projectActivity.create({
        data: { projectId, actorId: user.id, action: 'ASSIGNEE_CHANGED', detail: assigneeId ?? 'Unassigned' },
      });
      return updatedProject;
    });
    return this.publicProject(updated);
  }

  async sendMessage(user: AuthenticatedUser, projectId: string, messageBody: string) {
    const project = await this.findProject(projectId);
    this.assertProjectAccess(user, project.ownerId, project.assigneeId);
    const body = this.requiredText(messageBody, 'Message', 5000);
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.projectMessage.create({
        data: { projectId: project.id, authorId: user.id, body },
        include: { author: { select: { id: true, name: true, role: true } } },
      });
      await tx.projectActivity.create({
        data: { projectId: project.id, actorId: user.id, action: 'MESSAGE_SENT', detail: 'Project message sent' },
      });
      return message;
    });
  }

  async initiateUpload(
    user: AuthenticatedUser,
    projectId: string,
    input: { name?: string; contentType?: string; size?: number; kind?: string },
  ) {
    const project = await this.findProject(projectId);
    this.assertProjectAccess(user, project.ownerId, project.assigneeId);
    const kind = user.role === UserRole.SUPER_ADMIN || user.permissions.includes('projects:manage')
      ? input?.kind === ProjectFileKind.CLIENT_UPLOAD ? ProjectFileKind.CLIENT_UPLOAD : ProjectFileKind.DELIVERABLE
      : ProjectFileKind.CLIENT_UPLOAD;
    if (input?.kind && !Object.values(ProjectFileKind).includes(input.kind as ProjectFileKind)) {
      throw new BadRequestException('Choose a valid file category.');
    }
    const originalName = this.requiredText(input?.name, 'File name', 255);
    const extension = originalName.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      throw new BadRequestException('This file type is not supported.');
    }
    const maxFileSize = await this.maxFileSizeBytes();
    if (typeof input?.size !== 'number' || !Number.isSafeInteger(input.size) || input.size < 1 || input.size > maxFileSize) {
      throw new BadRequestException(`Files must be between 1 byte and ${Math.floor(maxFileSize / (1024 * 1024))} MB.`);
    }
    const fileSize = input.size;
    const contentType = this.requiredText(input?.contentType || 'application/octet-stream', 'Content type', 150);
    const familyKey = `${kind}:${originalName.toLowerCase()}`;
    const priorVersion = await this.prisma.projectFile.findFirst({
      where: { projectId, familyKey },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const version = (priorVersion?.version ?? 0) + 1;
    const fileId = randomUUID();
    const safeName = originalName.replace(/[^\w.-]+/g, '_').slice(0, 160);
    const storageKey = `projects/${projectId}/${kind.toLowerCase()}/${fileId}/${safeName}`;
    const bucket = this.bucketName();
    const s3 = this.s3();

    const upload = await s3.send(new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: storageKey,
      ContentType: contentType,
      Metadata: { projectid: projectId, fileid: fileId },
      ServerSideEncryption: 'AES256',
    }));
    if (!upload.UploadId) {
      throw new ServiceUnavailableException('Object storage did not return an upload session.');
    }

    try {
      const file = await this.prisma.$transaction(async (tx) => {
        const created = await tx.projectFile.create({
          data: {
            id: fileId,
            projectId,
            uploadedById: user.id,
            name: safeName,
            originalName,
            contentType,
            size: BigInt(fileSize),
            storageKey,
            multipartId: upload.UploadId,
            kind,
            status: ProjectFileStatus.UPLOADING,
            familyKey,
            version,
          },
        });
        await tx.projectActivity.create({
          data: { projectId, actorId: user.id, action: 'FILE_UPLOAD_STARTED', detail: `${kind}: ${originalName}` },
        });
        return created;
      });
      return {
        id: file.id,
        originalName: file.originalName,
        kind: file.kind,
        size: file.size.toString(),
        version: file.version,
        partSize: PART_SIZE,
        partCount: Math.ceil(fileSize / PART_SIZE),
      };
    } catch (error) {
      try {
        await s3.send(new AbortMultipartUploadCommand({
          Bucket: bucket,
          Key: storageKey,
          UploadId: upload.UploadId,
        }));
      } catch (cleanupError) {
        this.logger.error(`Failed to abort upload initialization ${fileId}.`, cleanupError);
        throw new ServiceUnavailableException('Upload initialization failed and the storage session could not be cleaned up. Contact support.');
      }
      throw error;
    }
  }

  async presignPart(user: AuthenticatedUser, projectId: string, fileId: string, partNumber: number) {
    const file = await this.findFile(projectId, fileId);
    const project = await this.findProject(projectId);
    this.assertProjectAccess(user, project.ownerId, project.assigneeId);
    if (file.status !== ProjectFileStatus.UPLOADING || !file.multipartId) {
      throw new BadRequestException('This file is not accepting upload parts.');
    }
    const partCount = Math.ceil(Number(file.size) / PART_SIZE);
    if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > Math.min(partCount, MAX_PARTS)) {
      throw new BadRequestException('Invalid upload part number.');
    }
    const url = await getSignedUrl(this.s3(), new UploadPartCommand({
      Bucket: this.bucketName(),
      Key: file.storageKey,
      UploadId: file.multipartId,
      PartNumber: partNumber,
      ContentLength: Math.min(PART_SIZE, Number(file.size) - (partNumber - 1) * PART_SIZE),
    }), { expiresIn: 900 });
    return { url, partNumber };
  }

  async completeUpload(
    user: AuthenticatedUser,
    projectId: string,
    fileId: string,
    inputParts: Array<{ partNumber: number; etag: string }>,
  ) {
    const file = await this.findFile(projectId, fileId);
    const project = await this.findProject(projectId);
    this.assertProjectAccess(user, project.ownerId, project.assigneeId);
    if (file.status !== ProjectFileStatus.UPLOADING || !file.multipartId) {
      throw new BadRequestException('This file is not awaiting completion.');
    }
    const partCount = Math.ceil(Number(file.size) / PART_SIZE);
    if (!Array.isArray(inputParts) || inputParts.length !== partCount) {
      throw new BadRequestException('All upload parts must be submitted before completion.');
    }
    const seen = new Set<number>();
    const parts = inputParts.map((part) => {
      if (
        !Number.isInteger(part.partNumber) ||
        part.partNumber < 1 ||
        part.partNumber > partCount ||
        seen.has(part.partNumber) ||
        typeof part.etag !== 'string' ||
        part.etag.length > 150 ||
        !/^(?:[a-fA-F0-9-]+|"[a-fA-F0-9-]+")$/.test(part.etag)
      ) {
        throw new BadRequestException('The uploaded part list is invalid.');
      }
      seen.add(part.partNumber);
      return { PartNumber: part.partNumber, ETag: part.etag };
    }).sort((a, b) => a.PartNumber - b.PartNumber);

    await this.s3().send(new CompleteMultipartUploadCommand({
      Bucket: this.bucketName(),
      Key: file.storageKey,
      UploadId: file.multipartId,
      MultipartUpload: { Parts: parts },
    }));
    const stored = await this.s3().send(new HeadObjectCommand({
      Bucket: this.bucketName(),
      Key: file.storageKey,
    }));
    if (stored.ContentLength !== Number(file.size)) {
      await this.prisma.$transaction(async (tx) => {
        await tx.projectFile.update({
          where: { id: file.id },
          data: { status: ProjectFileStatus.FAILED, multipartId: null },
        });
        await tx.projectActivity.create({
          data: { projectId, actorId: user.id, action: 'FILE_UPLOAD_FAILED', detail: `${file.originalName}: size mismatch` },
        });
      });
      try {
        await this.s3().send(new DeleteObjectCommand({
          Bucket: this.bucketName(),
          Key: file.storageKey,
        }));
      } catch (cleanupError) {
        this.logger.error(`Failed to remove size-mismatched upload ${file.id}.`, cleanupError);
        throw new ServiceUnavailableException('The uploaded file failed validation and could not be removed. Contact support.');
      }
      throw new BadRequestException('Uploaded file size does not match the declared size.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const completed = await tx.projectFile.update({
        where: { id: file.id },
        data: { status: ProjectFileStatus.SCANNING, multipartId: null },
        select: {
          id: true, originalName: true, kind: true, size: true,
          version: true, status: true, createdAt: true,
        },
      });
      await tx.projectActivity.create({
        data: {
          projectId,
          actorId: user.id,
          action: 'FILE_UPLOAD_COMPLETED',
          detail: `${file.originalName}; awaiting malware scan`,
        },
      });
      return completed;
    });
    return { ...updated, size: updated.size.toString() };
  }

  async scanStatus(user: AuthenticatedUser, projectId: string, fileId: string) {
    const file = await this.findFile(projectId, fileId);
    const project = await this.findProject(projectId);
    this.assertProjectAccess(user, project.ownerId, project.assigneeId);
    if (file.status !== ProjectFileStatus.SCANNING) return { status: file.status };

    const tagResponse = await this.s3().send(new GetObjectTaggingCommand({
      Bucket: this.bucketName(),
      Key: file.storageKey,
    }));
    const scanTagKey = process.env.AWS_S3_SCAN_TAG_KEY?.trim() || 'GuardDutyMalwareScanStatus';
    const scanStatus = tagResponse.TagSet?.find((tag) => tag.Key === scanTagKey)?.Value;
    if (!scanStatus) return { status: file.status };

    let nextStatus: ProjectFileStatus | undefined;
    if (scanStatus === 'NO_THREATS_FOUND') nextStatus = ProjectFileStatus.AVAILABLE;
    if (scanStatus === 'THREATS_FOUND' || scanStatus === 'UNSUPPORTED') nextStatus = ProjectFileStatus.REJECTED;
    if (!nextStatus) return { status: file.status };

    const updated = await this.prisma.$transaction(async (tx) => {
      const scanned = await tx.projectFile.update({
        where: { id: file.id, status: ProjectFileStatus.SCANNING },
        data: { status: nextStatus },
        select: { status: true },
      });
      await tx.projectActivity.create({
        data: {
          projectId,
          actorId: user.id,
          action: nextStatus === ProjectFileStatus.AVAILABLE ? 'FILE_SCAN_CLEAN' : 'FILE_SCAN_REJECTED',
          detail: `${file.originalName}: ${scanStatus}`,
        },
      });
      return scanned;
    });
    return { status: updated.status };
  }

  async abortUpload(user: AuthenticatedUser, projectId: string, fileId: string) {
    const file = await this.findFile(projectId, fileId);
    const project = await this.findProject(projectId);
    this.assertProjectAccess(user, project.ownerId, project.assigneeId);
    if (file.status !== ProjectFileStatus.UPLOADING || !file.multipartId) {
      return { success: true };
    }
    await this.s3().send(new AbortMultipartUploadCommand({
      Bucket: this.bucketName(),
      Key: file.storageKey,
      UploadId: file.multipartId,
    }));
    await this.prisma.$transaction(async (tx) => {
      await tx.projectFile.update({
        where: { id: file.id },
        data: { status: ProjectFileStatus.FAILED, multipartId: null },
      });
      await tx.projectActivity.create({
        data: { projectId, actorId: user.id, action: 'FILE_UPLOAD_ABORTED', detail: file.originalName },
      });
    });
    return { success: true };
  }

  async download(user: AuthenticatedUser, projectId: string, fileId: string) {
    const file = await this.findFile(projectId, fileId);
    const project = await this.findProject(projectId);
    this.assertProjectAccess(user, project.ownerId, project.assigneeId);
    if (file.status !== ProjectFileStatus.AVAILABLE) {
      throw new NotFoundException('The requested file is not available.');
    }
    if (user.role !== UserRole.SUPER_ADMIN && !user.permissions.includes('projects:manage') && file.kind !== ProjectFileKind.DELIVERABLE) {
      throw new ForbiddenException('Client source files are not available through this download link.');
    }
    const filename = file.originalName.replace(/[^\w.-]+/g, '_');
    const url = await getSignedUrl(this.s3(), new GetObjectCommand({
      Bucket: this.bucketName(),
      Key: file.storageKey,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    }), { expiresIn: 300 });
    return { url };
  }

  private async findProject(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found.');
    return project;
  }

  private async findFile(projectId: string, fileId: string) {
    const file = await this.prisma.projectFile.findFirst({ where: { id: fileId, projectId } });
    if (!file) throw new NotFoundException('Project file not found.');
    return file;
  }

  private assertProjectAccess(user: AuthenticatedUser, ownerId: string, assigneeId: string | null) {
    if (user.role === UserRole.SUPER_ADMIN || user.permissions.includes('projects:manage') || ownerId === user.id) return;
    if (assigneeId === user.id) return;
    throw new ForbiddenException('You do not have access to this project.');
  }

  private projectInclude() {
    return {
      owner: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      files: {
        orderBy: { createdAt: 'desc' as const },
        select: {
          id: true, name: true, originalName: true, contentType: true,
          size: true, kind: true, status: true, version: true,
          uploadedById: true, createdAt: true,
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' as const },
        take: 100,
        include: { author: { select: { id: true, name: true, role: true } } },
      },
      activities: {
        orderBy: { createdAt: 'desc' as const },
        take: 50,
      },
    };
  }

  private publicProject<T extends { files: Array<{ size: bigint }> }>(project: T) {
    return {
      ...project,
      files: project.files.map((file) => ({ ...file, size: file.size.toString() })),
    };
  }

  private requiredText(value: unknown, label: string, maxLength: number): string {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
      throw new BadRequestException(`${label} is required and must be ${maxLength} characters or fewer.`);
    }
    return value.trim();
  }

  private bucketName() {
    const bucket = process.env.AWS_S3_BUCKET?.trim();
    if (!bucket) throw new ServiceUnavailableException('AWS_S3_BUCKET is not configured.');
    return bucket;
  }

  private async maxFileSizeBytes(): Promise<number> {
    const setting = await this.prisma.cmsSetting.findUnique({
      where: { key: 'projectUploadLimitMb' },
      select: { value: true },
    });
    const configured = setting?.value ?? process.env.MAX_PROJECT_UPLOAD_SIZE_MB?.trim();
    if (configured === undefined || configured === null || configured === '') {
      return DEFAULT_MAX_FILE_SIZE_MB * 1024 * 1024;
    }
    const megabytes = typeof configured === 'number' ? configured : Number(configured);
    if (!Number.isInteger(megabytes) || megabytes < 1 || megabytes > MAX_CONFIGURED_FILE_SIZE_MB) {
      throw new ServiceUnavailableException(
        `MAX_PROJECT_UPLOAD_SIZE_MB must be a whole number between 1 and ${MAX_CONFIGURED_FILE_SIZE_MB}.`,
      );
    }
    return megabytes * 1024 * 1024;
  }

  private s3() {
    if (this.s3Client) return this.s3Client;
    const region = process.env.AWS_REGION?.trim();
    if (!region) throw new ServiceUnavailableException('AWS_REGION is not configured.');
    const endpoint = process.env.AWS_S3_ENDPOINT?.trim();
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
    if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
      throw new ServiceUnavailableException('Configure both AWS access key variables or use the runtime IAM role.');
    }
    this.s3Client = new S3Client({
      region,
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });
    return this.s3Client;
  }
}


