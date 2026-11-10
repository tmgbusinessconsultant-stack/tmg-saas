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
import { StorageService } from '../common/storage/storage.service';
import { MalwareScanService } from '../common/storage/malware-scan.service';
import { MailService } from '../mail/mail.service';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly malwareScan: MalwareScanService,
    private readonly mail: MailService,
  ) {}

  private isAdmin(user: AuthenticatedUser) {
    const r = user.role?.toString().toUpperCase();
    return ['ADMIN','SUPER_ADMIN','ADMIN_MANAGER','PROJECT_MANAGER','STAFF','CONTENT_MANAGER','FINANCE_MANAGER'].includes(r);
  }

  private async assertAccess(user: AuthenticatedUser, projectId: string) {
    const project = await (this.prisma as any).project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (this.isAdmin(user)) return project;
    if (project.ownerId === user.id) return project;
    if (user.role?.toString().toUpperCase() === 'CLIENT') throw new ForbiddenException('No access');
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
          videoLinks: { orderBy: { createdAt: 'desc' } },
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
          inboxStatus: f.inboxStatus || 'NEW',
          version: f.version,
          createdAt: f.createdAt,
        })),
        videoLinks: (p.videoLinks || []).map((v: any) => ({
          id: v.id,
          url: v.url,
          type: v.type,
          title: v.title,
          inboxStatus: v.inboxStatus || 'NEW',
          createdAt: v.createdAt,
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

  async updateProject(user: AuthenticatedUser, projectId: string, input: unknown) {
    const project = await this.assertAccess(user, projectId);
    if (user.role?.toString().toUpperCase() === 'CLIENT' && project.ownerId !== user.id) {
      throw new ForbiddenException('No access');
    }
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new BadRequestException('Project changes are required.');
    }

    const body = input as Record<string, unknown>;
    const data: { title?: string; description?: string; serviceType?: string } = {};
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 200) {
        throw new BadRequestException('Project title must be between 1 and 200 characters.');
      }
      data.title = body.title.trim();
    }
    if (body.description !== undefined) {
      if (typeof body.description !== 'string' || body.description.length > 10_000) {
        throw new BadRequestException('Project description must not exceed 10,000 characters.');
      }
      data.description = body.description;
    }
    if (body.serviceType !== undefined) {
      if (typeof body.serviceType !== 'string' || !body.serviceType.trim() || body.serviceType.trim().length > 100) {
        throw new BadRequestException('Project service type must be between 1 and 100 characters.');
      }
      data.serviceType = body.serviceType.trim();
    }
    if (Object.keys(data).length === 0) throw new BadRequestException('No editable project fields were provided.');

    return (this.prisma as any).project.update({ where: { id: projectId }, data });
  }

  async deleteProject(user: AuthenticatedUser, projectId: string) {
    const project = await this.assertAccess(user, projectId);
    if (user.role?.toString().toUpperCase() === 'CLIENT' && project.ownerId !== user.id) {
      throw new ForbiddenException('No access');
    }
    await (this.prisma as any).project.delete({ where: { id: projectId } });
    return { success: true };
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
    const file = await this.getProjectFile(projectId, fileId);
    try { await this.storage.deleteFile(file.storageKey); } catch {}
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

    const stored = `${randomUUID()}${ext}`;
    const storageKey = `projects/${project.id}/${stored}`;
    const familyKey = `${file.originalname || stored}-${Date.now()}`;
    const record = await (this.prisma as any).projectFile.create({
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
        status: 'PENDING',
        version: 1,
      },
    });

    const tempPath = this.storage.getTempPath('project-file');
    try {
      fs.writeFileSync(tempPath, file.buffer);
      const scan = await this.malwareScan.scanFile(tempPath);
      if (!scan.clean) {
        await this.storage.cleanupTemp(tempPath);
        await (this.prisma as any).projectFile.update({
          where: { id: record.id },
          data: { status: 'INFECTED' },
        });
        this.logger.warn(`Blocked infected upload: ${record.id} signature=${scan.signature || 'unknown'}`);
        throw new ForbiddenException('Upload blocked: malware detected by ClamAV scan.');
      }
      await this.storage.saveFile(storageKey, file.buffer, file.mimetype || 'application/octet-stream');
      await this.storage.cleanupTemp(tempPath);
      const saved = await (this.prisma as any).projectFile.update({
        where: { id: record.id },
        data: { status: 'CLEAN' },
      });
      void this.notifyUploadReceived(project, user, saved, file.buffer);
      return saved;
    } catch (error) {
      await this.storage.cleanupTemp(tempPath);
      if (!(error instanceof ForbiddenException)) {
        try { await (this.prisma as any).projectFile.update({ where: { id: record.id }, data: { status: 'INFECTED' } }); } catch {}
        try { await this.storage.deleteFile(storageKey); } catch {}
      }
      throw error;
    }
  }

  async handleFileDownload(user: AuthenticatedUser, projectId: string, fileId: string) {
    const project = await this.assertAccess(user, projectId);
    const file = await this.getProjectFile(project.id, fileId);
    if (file.status !== 'CLEAN') {
      throw new ForbiddenException('This file is unavailable. Only CLEAN (scanned) files can be downloaded.');
    }
    const buffer = await this.storage.getFileBuffer(file.storageKey).catch(() => null);
    if (!buffer) throw new NotFoundException('File is missing from storage.');
    return { mode: 'buffer' as const, buffer, originalName: file.originalName, contentType: file.contentType };
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
      data: { status: 'INFECTED' },
    });
  }
  async scanStatus(user: AuthenticatedUser, projectId: string, fileId: string) {
    await this.assertAccess(user, projectId);
    const file = await this.getProjectFile(projectId, fileId);
    return { status: file.status, scanned: file.status === 'CLEAN', clean: file.status === 'CLEAN', infected: file.status === 'INFECTED' };
  }
  async download(user: AuthenticatedUser, projectId: string, fileId: string) { return this.handleFileDownload(user, projectId, fileId); }

  private projectLink(projectId: string): string {
    const base = (process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
    return `${base}/admin/projects?projectId=${encodeURIComponent(projectId)}`;
  }

  private formatSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  }

  private async notifyUploadReceived(project: any, user: AuthenticatedUser, saved: any, buffer: Buffer): Promise<void> {
    try {
      const adminEmail = this.mail.getAdminNotificationEmail();
      const projectLink = this.projectLink(project.id);
      const fileName = saved.originalName || 'file';
      const sizeText = this.formatSize(buffer.byteLength);
      const clientName = user.name || user.email || 'Client';
      const projectName = project.title || project.id;
      const subject = `New project file uploaded: ${projectName}`;
      const text = [
        `Client: ${clientName} (${user.email || 'n/a'})`,
        `Project: ${projectName} (${project.id})`,
        `File: ${fileName}`,
        `Size: ${sizeText}`,
        `Status: ${saved.status}`,
        `Project link: ${projectLink}`,
      ].join('\n');
      const attach = buffer.byteLength < 20 * 1024 * 1024
        ? [{ filename: fileName, content: buffer, contentType: saved.contentType || 'application/octet-stream' }]
        : undefined;
      const linkNote = buffer.byteLength >= 20 * 1024 * 1024 ? '\n\nFile is 20MB or larger; download it from the project link (no attachment).' : '';
      await this.mail.send(adminEmail, subject, text + linkNote);

      if (user.email) {
        await this.mail.send(
          user.email,
          'We received your file - TMG Business Consulting',
          `Hi ${clientName},\n\nWe received your file "${fileName}" for project "${projectName}".\nStatus: ${saved.status}.\n\nOur team will review it shortly.`,
        );
      }
    } catch (e) {
      this.logger.warn(`Upload notification failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async addVideoLink(user: AuthenticatedUser, projectId: string, body: { url?: string; type?: string; title?: string }) {
    const project = await this.assertAccess(user, projectId);
    const rawUrl = String(body?.url || '').trim();
    if (!rawUrl) throw new BadRequestException('A video URL is required.');
    let parsed: URL;
    try { parsed = new URL(rawUrl); } catch { throw new BadRequestException('Invalid video URL.'); }
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const isYoutube = host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be';
    const isTiktok = host === 'tiktok.com' || host.endsWith('.tiktok.com');
    const requested = String(body?.type || '').toUpperCase();
    const type = requested === 'TIKTOK' || (!isYoutube && isTiktok) ? 'TIKTOK' : (requested === 'YOUTUBE' || isYoutube ? 'YOUTUBE' : null);
    if (!type || (!isYoutube && !isTiktok)) {
      throw new BadRequestException('Only YouTube or TikTok links are supported.');
    }
    const link = await (this.prisma as any).videoLink.create({
      data: {
        projectId: project.id,
        addedById: user.id,
        url: parsed.toString(),
        type,
        title: body?.title ? String(body.title).slice(0, 200) : null,
        inboxStatus: 'NEW',
      },
    });
    void this.notifyVideoLinkAdded(project, user, link);
    return link;
  }

  private async notifyVideoLinkAdded(project: any, user: AuthenticatedUser, link: any): Promise<void> {
    try {
      const adminEmail = this.mail.getAdminNotificationEmail();
      const subject = `New video link added: ${project.title || project.id}`;
      const text = [
        `Client: ${user.name || user.email || 'Client'} (${user.email || 'n/a'})`,
        `Project: ${project.title || project.id} (${project.id})`,
        `Type: ${link.type}`,
        `URL: ${link.url}`,
        `Project link: ${this.projectLink(project.id)}`,
      ].join('\n');
      await this.mail.send(adminEmail, subject, text);
      if (user.email) {
        await this.mail.send(
          user.email,
          'We received your video link - TMG Business Consulting',
          `Hi ${user.name || 'there'},\n\nWe received your ${link.type} video link for project "${project.title || project.id}".\n\nOur team will review it shortly.`,
        );
      }
    } catch (e) {
      this.logger.warn(`Video link notification failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async listInbox(user: AuthenticatedUser) {
    if (!this.isAdmin(user)) throw new ForbiddenException('Admin only');
    const [files, links] = await Promise.all([
      (this.prisma as any).projectFile.findMany({
        where: { kind: 'CLIENT_UPLOAD' },
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
          Project: { select: { id: true, title: true } },
          User: { select: { id: true, name: true, email: true } },
        },
      }),
      (this.prisma as any).videoLink.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
          project: { select: { id: true, title: true } },
          addedBy: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);
    const items = [
      ...files.map((f: any) => ({
        id: `file:${f.id}`,
        itemType: 'FILE_UPLOAD',
        refId: f.id,
        projectId: f.projectId,
        projectTitle: f.Project?.title || f.projectId,
        title: f.originalName,
        subtitle: `${f.status} · ${this.formatSize(Number(f.size || 0))}`,
        from: f.User?.name || f.User?.email || 'Client',
        url: null,
        status: f.inboxStatus || 'NEW',
        createdAt: f.createdAt,
      })),
      ...links.map((v: any) => ({
        id: `video:${v.id}`,
        itemType: 'VIDEO_LINK',
        refId: v.id,
        projectId: v.projectId,
        projectTitle: v.project?.title || v.projectId,
        title: v.title || v.type,
        subtitle: v.type,
        from: v.addedBy?.name || v.addedBy?.email || 'Client',
        url: v.url,
        status: v.inboxStatus || 'NEW',
        createdAt: v.createdAt,
      })),
    ];
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { items };
  }

  async markInboxSeen(user: AuthenticatedUser) {
    if (!this.isAdmin(user)) throw new ForbiddenException('Admin only');
    await Promise.all([
      (this.prisma as any).projectFile.updateMany({ where: { kind: 'CLIENT_UPLOAD', inboxStatus: 'NEW' }, data: { inboxStatus: 'SEEN' } }),
      (this.prisma as any).videoLink.updateMany({ where: { inboxStatus: 'NEW' }, data: { inboxStatus: 'SEEN' } }),
    ]);
    return { success: true };
  }

  async updateInboxStatus(user: AuthenticatedUser, itemType: string, id: string, status: string) {
    if (!this.isAdmin(user)) throw new ForbiddenException('Admin only');
    const allowed = new Set(['NEW', 'SEEN', 'DELIVERED']);
    if (!allowed.has(status)) throw new BadRequestException('Invalid inbox status.');
    if (itemType === 'file' || itemType === 'FILE_UPLOAD') {
      await this.getProjectFile((await (this.prisma as any).projectFile.findUnique({ where: { id } }))?.projectId || '', id).catch(async () => {
        const f = await (this.prisma as any).projectFile.findUnique({ where: { id } });
        if (!f) throw new NotFoundException('File not found');
      });
      return (this.prisma as any).projectFile.update({ where: { id }, data: { inboxStatus: status } });
    }
    if (itemType === 'video' || itemType === 'VIDEO_LINK') {
      const v = await (this.prisma as any).videoLink.findUnique({ where: { id } });
      if (!v) throw new NotFoundException('Video link not found');
      return (this.prisma as any).videoLink.update({ where: { id }, data: { inboxStatus: status } });
    }
    throw new BadRequestException('Invalid inbox item type.');
  }
}
