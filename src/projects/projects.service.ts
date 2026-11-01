import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.service';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  constructor(private readonly prisma: PrismaService) {}

  private isAdmin(user: AuthenticatedUser) {
    const r = (user as any).role?.toString().toUpperCase();
    return ['ADMIN','SUPER_ADMIN','ADMIN_MANAGER','PROJECT_MANAGER','STAFF','CONTENT_MANAGER','FINANCE_MANAGER'].includes(r);
  }

  private async assertAccess(user: AuthenticatedUser, projectId: string) {
    const project = await (this.prisma as any).project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (this.isAdmin(user)) return project;
    if (project.ownerId === user.id) return project;
    if (project.assigneeId === user.id) return project;
    throw new ForbiddenException('No access');
  }

  private async getProjectFile(projectId: string, fileId: string) {
    const file = await (this.prisma as any).projectFile.findFirst({
      where: { id: fileId, projectId },
    });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }

  async list(user: AuthenticatedUser) {
    try {
      const where = this.isAdmin(user) ? {} : { ownerId: user.id };
      const projects = await (this.prisma as any).project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
          User_Project_ownerIdToUser: { select: { id: true, name: true, email: true } },
          User_Project_assigneeIdToUser: { select: { id: true, name: true, email: true } },
          ProjectFile: { orderBy: { createdAt: 'desc' } },
          ProjectMessage: { orderBy: { createdAt: 'asc' }, include: { User: { select: { id: true, name: true, role: true } } } },
        },
      });

      return projects.map((p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        serviceType: p.serviceType,
        status: p.status,
        ownerId: p.ownerId,
        assigneeId: p.assigneeId,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        owner: p.User_Project_ownerIdToUser,
        assignee: p.User_Project_assigneeIdToUser,
        files: (p.ProjectFile || []).map((f: any) => ({
          id: f.id,
          originalName: f.originalName,
          name: f.name,
          kind: f.kind,
          size: f.size?.toString() || '0',
          status: f.status,
          version: f.version,
          createdAt: f.createdAt,
        })),
        messages: (p.ProjectMessage || []).map((m: any) => ({
          id: m.id,
          body: m.body,
          createdAt: m.createdAt,
          authorId: m.authorId,
          author: m.User || { id: m.authorId, name: 'User', role: 'CLIENT' },
        })),
      }));
    } catch (e) {
      this.logger.error('list failed', e);
      throw e;
    }
  }

  async listStaff() {
    try {
      return await (this.prisma as any).user.findMany({
        where: { role: { in: ['STAFF','ADMIN','SUPER_ADMIN','PROJECT_MANAGER'] } },
        select: { id: true, name: true, email: true, role: true },
        take: 100,
      });
    } catch { return []; }
  }

  async create(user: AuthenticatedUser, body: any) {
    return (this.prisma as any).project.create({
      data: {
        ownerId: user.id,
        title: body.title || 'New Project',
        description: body.description || '',
        serviceType: body.serviceType || 'GENERAL',
        status: 'PENDING',
      },
    });
  }

  async updateStatus(user: AuthenticatedUser, projectId: string, status: string) {
    if (!status) throw new NotFoundException('Status required');
    if (!this.isAdmin(user)) throw new ForbiddenException('Admin only');
    await this.assertAccess(user, projectId);
    return (this.prisma as any).project.update({ where: { id: projectId }, data: { status } });
  }

  async assign(user: AuthenticatedUser, projectId: string, assigneeId: string | null) {
    if (!this.isAdmin(user)) throw new ForbiddenException('Admin only');
    return (this.prisma as any).project.update({ where: { id: projectId }, data: { assigneeId: assigneeId || null } });
  }

  async sendMessage(user: AuthenticatedUser, projectId: string, body: string) {
    if (!body?.trim()) throw new NotFoundException('Message required');
    await this.assertAccess(user, projectId);
    return (this.prisma as any).projectMessage.create({ data: { projectId, authorId: user.id, body: body.trim() } });
  }

  async deleteMessage(user: AuthenticatedUser, projectId: string, messageId: string) {
    await this.assertAccess(user, projectId);
    const message = await (this.prisma as any).projectMessage.findFirst({
      where: { id: messageId, projectId },
      select: { id: true },
    });
    if (!message) throw new NotFoundException('Message not found');
    await (this.prisma as any).projectMessage.delete({ where: { id: message.id } });
    return { success: true };
  }

  async deleteFile(user: AuthenticatedUser, projectId: string, fileId: string) {
    await this.assertAccess(user, projectId);
    await this.getProjectFile(projectId, fileId);
    await (this.prisma as any).projectFile.delete({ where: { id: fileId } });
    return { success: true };
  }

  async handleFileUpload(user: AuthenticatedUser, projectId: string, file: any, kind: string) {
    const project = await this.assertAccess(user, projectId);
    if (!file) throw new NotFoundException('No file');
    if (!Buffer.isBuffer(file.buffer) || file.size !== file.buffer.byteLength) {
      throw new BadRequestException('The uploaded file is invalid.');
    }
    if (file.size > 100 * 1024 * 1024) {
      throw new BadRequestException('Project files must not exceed 100 MB.');
    }
    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowedExtensions = new Set([
      '.doc', '.docx', '.pdf', '.xls', '.xlsx', '.csv', '.pptx', '.txt',
      '.json', '.xml', '.zip', '.png', '.jpg', '.jpeg', '.webp',
    ]);
    if (!allowedExtensions.has(ext)) {
      throw new BadRequestException('This file type is not supported.');
    }

    const dir = path.join(process.cwd(), 'private-uploads', 'projects', project.id);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const stored = `${randomUUID()}${ext}`;
    fs.writeFileSync(path.join(dir, stored), file.buffer);

    const storageKey = `projects/${project.id}/${stored}`;
    const familyKey = `${file.originalname || stored}-${Date.now()}`;

    return (this.prisma as any).projectFile.create({
      data: {
        projectId: project.id,
        uploadedById: user.id,
        name: stored,
        originalName: file.originalname || 'file',
        contentType: file.mimetype || 'application/octet-stream',
        size: BigInt(file.size || 0),
        storageKey,
        familyKey,
        kind: (kind === 'DELIVERABLE' ? 'DELIVERABLE' : 'CLIENT_UPLOAD') as any,
        status: 'SCANNING',
        version: 1,
      },
    });
  }

  async handleFileDownload(user: AuthenticatedUser, projectId: string, fileId: string) {
    const project = await this.assertAccess(user, projectId);
    const file = await this.getProjectFile(project.id, fileId);
    if (file.status !== 'AVAILABLE') {
      throw new ForbiddenException('This file is unavailable until malware scanning is complete.');
    }
    if (typeof file.name !== 'string' || path.basename(file.name) !== file.name) {
      throw new ForbiddenException('The stored file path is invalid.');
    }
    const privateRoot = path.resolve(process.cwd(), 'private-uploads', 'projects', project.id);
    const filePath = path.resolve(privateRoot, file.name);
    if (!filePath.startsWith(`${privateRoot}${path.sep}`)) {
      throw new ForbiddenException('The stored file path is invalid.');
    }
    if (!fs.existsSync(filePath)) throw new NotFoundException('File missing on disk - old uploads may be gone after reinstall');
    return { path: filePath, originalName: file.originalName, contentType: file.contentType };
  }

  async initiateUpload(user: AuthenticatedUser, projectId: string, _body: any) {
    await this.assertAccess(user, projectId);
    throw new ServiceUnavailableException('Multipart uploads are unavailable until private storage and malware scanning are configured.');
  }
  async presignPart(user: AuthenticatedUser, projectId: string, fileId: string, _partNumber: number) {
    await this.assertAccess(user, projectId);
    await this.getProjectFile(projectId, fileId);
    throw new ServiceUnavailableException('Multipart uploads are unavailable until private storage and malware scanning are configured.');
  }
  async completeUpload(user: AuthenticatedUser, projectId: string, fileId: string, _parts: any) {
    await this.assertAccess(user, projectId);
    await this.getProjectFile(projectId, fileId);
    throw new ServiceUnavailableException('Uploads cannot be made available without a verified malware scan.');
  }
  async abortUpload(user: AuthenticatedUser, projectId: string, fileId: string) {
    await this.assertAccess(user, projectId);
    await this.getProjectFile(projectId, fileId);
    return (this.prisma as any).projectFile.update({
      where: { id: fileId },
      data: { status: 'FAILED' },
    });
  }
  async scanStatus(user: AuthenticatedUser, projectId: string, fileId: string) {
    await this.assertAccess(user, projectId);
    const file = await this.getProjectFile(projectId, fileId);
    return { status: file.status, scanResult: null, scanned: false };
  }
  async download(user: AuthenticatedUser, projectId: string, fileId: string) { return this.handleFileDownload(user, projectId, fileId); }
}
