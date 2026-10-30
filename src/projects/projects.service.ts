import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
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
    await (this.prisma as any).projectMessage.delete({ where: { id: messageId } });
    return { success: true };
  }

  async deleteFile(user: AuthenticatedUser, projectId: string, fileId: string) {
    await this.assertAccess(user, projectId);
    await (this.prisma as any).projectFile.delete({ where: { id: fileId } });
    return { success: true };
  }

  async handleFileUpload(user: AuthenticatedUser, projectId: string, file: any, kind: string) {
    await this.assertAccess(user, projectId);
    if (!file) throw new NotFoundException('No file');
    const dir = path.join(process.cwd(), 'uploads', 'projects', projectId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const ext = path.extname(file.originalname || '');
    const stored = `${randomUUID()}${ext}`;
    fs.writeFileSync(path.join(dir, stored), file.buffer);

    const storageKey = `projects/${projectId}/${stored}`;
    const familyKey = `${file.originalname || stored}-${Date.now()}`;

    return (this.prisma as any).projectFile.create({
      data: {
        projectId,
        uploadedById: user.id,
        name: stored,
        originalName: file.originalname || 'file',
        contentType: file.mimetype || 'application/octet-stream',
        size: BigInt(file.size || 0),
        storageKey,
        familyKey,
        kind: (kind === 'DELIVERABLE' ? 'DELIVERABLE' : 'CLIENT_UPLOAD') as any,
        status: 'AVAILABLE',
        version: 1,
      },
    });
  }

  async handleFileDownload(user: AuthenticatedUser, projectId: string, fileId: string) {
    await this.assertAccess(user, projectId);
    const file = await (this.prisma as any).projectFile.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');
    const filePath = path.join(process.cwd(), 'uploads', 'projects', projectId, file.name);
    if (!fs.existsSync(filePath)) throw new NotFoundException('File missing on disk - old uploads may be gone after reinstall');
    return { path: filePath, originalName: file.originalName, contentType: file.contentType };
  }

  // Legacy stubs for compatibility
  async initiateUpload(user: AuthenticatedUser, projectId: string, body: any) {
    await this.assertAccess(user, projectId);
    return (this.prisma as any).projectFile.create({
      data: {
        projectId,
        uploadedById: user.id,
        name: body.name || 'file',
        originalName: body.name || 'file',
        contentType: body.contentType || 'application/octet-stream',
        size: BigInt(body.size || 0),
        storageKey: `projects/${projectId}/${randomUUID()}`,
        familyKey: `${body.name || 'file'}-${Date.now()}`,
        kind: 'CLIENT_UPLOAD',
        status: 'UPLOADING',
        version: 1,
      },
    });
  }
  async presignPart(user: AuthenticatedUser, projectId: string, fileId: string, partNumber: number) { return { fileId, partNumber, url: '' }; }
  async completeUpload(user: AuthenticatedUser, projectId: string, fileId: string, parts: any){ return (this.prisma as any).projectFile.update({ where: { id: fileId }, data: { status: 'AVAILABLE' } }); }
  async abortUpload(user: AuthenticatedUser, projectId: string, fileId: string) { return (this.prisma as any).projectFile.update({ where: { id: fileId }, data: { status: 'FAILED' } }); }
  async scanStatus(user: AuthenticatedUser, projectId: string, fileId: string) { const f = await (this.prisma as any).projectFile.findUnique({ where: { id: fileId } }); return { status: f?.status || 'AVAILABLE', scanResult: 'CLEAN' }; }
  async download(user: AuthenticatedUser, projectId: string, fileId: string) { return this.handleFileDownload(user, projectId, fileId); }
}
