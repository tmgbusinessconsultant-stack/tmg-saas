import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.service';
import { randomUUID } from 'crypto';
import { CmsMediaStorageService } from './cms-media-storage.service';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaStorage: CmsMediaStorageService,
  ) {}

  private slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || `item-${Date.now()}`;
  }

  private async audit(actorId: string, action: string, entityType: string, entityId: string, detail?: any) {
    await (this.prisma as any).contentAuditLog.create({ data: { actorId, action, entityType, entityId, detail: detail || {} } });
  }

  // ========= PUBLIC BLOG =========
  async listPublishedPosts() {
    return (this.prisma as any).blogPost.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ publishDate: 'desc' }, { createdAt: 'desc' }],
      include: { BlogCategory: true },
    });
  }

  async getPublishedPost(slug: string) {
    const post = await (this.prisma as any).blogPost.findUnique({ where: { slug }, include: { BlogCategory: true } });
    if (!post || post.status !== 'PUBLISHED') throw new NotFoundException('Post not found');
    return post;
  }

  // ========= PUBLIC GALLERY =========
  async listGallery() {
    const items = await (this.prisma as any).galleryItem.findMany({
      where: {
        isVisible: true,
        ContentMedia: {
          is: {
            status: 'AVAILABLE',
            publishedLocations: { has: 'gallery' },
          },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        ContentMedia: {
          select: { id: true, originalName: true, contentType: true, status: true, publishedLocations: true },
        },
      },
    });
    return items.map((item: any) => ({
      ...item,
      image: `/content/media/${encodeURIComponent(item.mediaId)}/file`,
    }));
  }

  // ========= PUBLIC MEDIA =========
  async listPublishedMedia(location?: string) {
    const where: any = { status: 'AVAILABLE' };
    if (location) where.publishedLocations = { has: location };
    const media = await (this.prisma as any).contentMedia.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        originalName: true,
        contentType: true,
        size: true,
        status: true,
        publishedLocations: true,
        createdAt: true,
        updatedAt: true,
        storageKey: true,
      },
    });
    return media.map((item: any) => ({
      ...item,
      size: item.size.toString(),
      url: `/content/media/${encodeURIComponent(item.id)}/file`,
    }));
  }

  async getPublishedMedia(id: string) {
    const media = await (this.prisma as any).contentMedia.findUnique({ where: { id } });
    if (!media || media.status !== 'AVAILABLE') throw new NotFoundException('Media not found');
    if (media.publishedLocations?.length === 0) throw new NotFoundException('Media not published');
    const body = await this.mediaStorage.getObject(media.storageKey);
    return { contentType: media.contentType, body };
  }

  // ========= ADMIN MEDIA =========
  async listMedia(search?: string, type?: string) {
    const where: any = {};
    if (search) where.originalName = { contains: search, mode: 'insensitive' };
    if (type) where.contentType = { contains: type, mode: 'insensitive' };
    const media = await (this.prisma as any).contentMedia.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        originalName: true,
        contentType: true,
        size: true,
        status: true,
        publishedLocations: true,
        storageKey: true,
        createdAt: true,
        updatedAt: true,
        GalleryItem: { select: { id: true, title: true, isVisible: true } },
      },
    });
    return media.map((item: any) => ({
      id: item.id,
      originalName: item.originalName,
      contentType: item.contentType,
      size: item.size.toString(),
      status: item.status,
      scanStatus: item.status === 'AVAILABLE' ? 'PASSED'
        : item.status === 'SCANNING' ? 'PENDING'
          : item.status === 'REJECTED' ? 'FAILED'
            : 'NOT_SCANNED',
      url: `/content/media/${encodeURIComponent(item.id)}/file`,
      previewUrl: `/admin/content/media/${encodeURIComponent(item.id)}/preview`,
      locations: item.publishedLocations,
      usages: item.GalleryItem.map((gallery: any) => ({
        entityType: 'GALLERY',
        entityId: gallery.id,
        label: gallery.title,
        href: '/gallery',
        published: gallery.isVisible,
      })),
      createdAt: item.createdAt,
    }));
  }

  async getAdminMediaPreview(id: string) {
    const media = await (this.prisma as any).contentMedia.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
    if (media.status !== 'AVAILABLE') {
      throw new BadRequestException('Media cannot be previewed until malware scanning is complete.');
    }
    const body = await this.mediaStorage.getObject(media.storageKey);
    return { contentType: media.contentType, body };
  }

  async uploadMedia(file: Express.Multer.File, location: string, user: AuthenticatedUser) {
    this.validateMediaFile(file);
    const allowedLocations = new Set(['blog', 'services', 'clients', 'gallery', 'documents']);
    if (location && !allowedLocations.has(location)) {
      throw new BadRequestException('Unsupported media publication location.');
    }
    const storageKey = `media/${randomUUID()}`;
    await this.mediaStorage.putObject(storageKey, file.buffer, file.mimetype);
    let media;
    try {
      media = await (this.prisma as any).contentMedia.create({
        data: {
          uploadedById: user.id,
          storageKey,
          originalName: this.safeFileName(file.originalname),
          contentType: file.mimetype,
          size: BigInt(file.size),
          status: 'SCANNING',
          publishedLocations: location ? [location] : [],
          fileData: null,
        },
      });
    } catch (error) {
      await this.mediaStorage.deleteObject(storageKey);
      throw error;
    }
    await this.audit(user.id, 'UPLOAD', 'ContentMedia', media.id, { location });
    return media;
  }

  async replaceMedia(id: string, file: Express.Multer.File, user: AuthenticatedUser) {
    this.validateMediaFile(file);
    const existing = await (this.prisma as any).contentMedia.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Media not found');
    const storageKey = `media/${randomUUID()}`;
    await this.mediaStorage.putObject(storageKey, file.buffer, file.mimetype);
    let updated;
    try {
      updated = await (this.prisma as any).contentMedia.update({
        where: { id },
        data: {
          originalName: this.safeFileName(file.originalname),
          contentType: file.mimetype,
          size: BigInt(file.size),
          fileData: null,
          storageKey,
          status: 'SCANNING',
          publishedLocations: [],
        },
      });
    } catch (error) {
      await this.mediaStorage.deleteObject(storageKey);
      throw error;
    }
    try {
      await this.mediaStorage.deleteObject(existing.storageKey);
    } catch (error) {
      this.logger.error(`Previous CMS media object ${existing.storageKey} needs cleanup.`, error);
    }
    await this.audit(user.id, 'REPLACE', 'ContentMedia', id);
    return updated;
  }

  async updateMedia(id: string, locations: string[] | undefined, user: AuthenticatedUser) {
    const media = await (this.prisma as any).contentMedia.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
    const allowedLocations = new Set(['blog', 'services', 'clients', 'gallery', 'documents']);
    if (locations?.some((location) => !allowedLocations.has(location))) {
      throw new BadRequestException('Unsupported media publication location.');
    }
    if (media.status !== 'AVAILABLE' && locations?.length) {
      throw new BadRequestException('Media cannot be published until malware scanning is complete.');
    }
    const updated = await (this.prisma as any).contentMedia.update({
      where: { id },
      data: { publishedLocations: locations ?? [] },
    });
    await this.audit(user.id, 'UPDATE_LOCATIONS', 'ContentMedia', id, { locations });
    return updated;
  }

  async refreshMediaScan(id: string, user: AuthenticatedUser) {
    const media = await (this.prisma as any).contentMedia.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
    if (media.status !== 'SCANNING') {
      return { id, status: media.status, scanned: media.status === 'AVAILABLE' || media.status === 'REJECTED' };
    }
    const scanResult = await this.mediaStorage.getScanResult(media.storageKey);
    if (!scanResult) {
      return { id, status: media.status, scanned: false, reason: 'GuardDuty has not published a scan-result tag yet.' };
    }

    const nextStatus = scanResult === 'NO_THREATS_FOUND'
      ? 'AVAILABLE'
      : ['THREATS_FOUND', 'FAILED', 'UNSUPPORTED', 'ACCESS_DENIED', 'UNAVAILABLE', 'SKIPPED'].includes(scanResult)
        ? 'REJECTED'
        : null;
    if (!nextStatus) {
      return { id, status: media.status, scanned: false, reason: 'The GuardDuty scan result is not recognized.' };
    }

    const update = await (this.prisma as any).contentMedia.updateMany({
      where: { id, status: 'SCANNING' },
      data: { status: nextStatus },
    });
    const status = update.count
      ? nextStatus
      : (await (this.prisma as any).contentMedia.findUnique({ where: { id }, select: { status: true } }))?.status;
    await this.audit(user.id, 'SCAN_RESULT', 'ContentMedia', id, { scanResult, status });
    return { id, status, scanned: true, scanResult };
  }

  async deleteMedia(id: string, user: AuthenticatedUser) {
    const media = await (this.prisma as any).contentMedia.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
    await (this.prisma as any).contentMedia.update({
      where: { id },
      data: { status: 'DELETING', publishedLocations: [] },
    });
    try {
      await this.mediaStorage.deleteObject(media.storageKey);
    } catch (error) {
      await (this.prisma as any).contentMedia.update({
        where: { id },
        data: { status: media.status, publishedLocations: media.publishedLocations },
      });
      throw error;
    }
    await (this.prisma as any).galleryItem.deleteMany({ where: { mediaId: id } });
    await (this.prisma as any).contentMedia.delete({ where: { id } });
    await this.audit(user.id, 'DELETE', 'ContentMedia', id);
    return { success: true };
  }

  // ========= CATEGORIES =========
  async listCategories() {
    return (this.prisma as any).blogCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async createCategory(name: string | undefined, user: AuthenticatedUser) {
    if (!name?.trim()) throw new BadRequestException('Name required');
    const slug = this.slugify(name);
    const cat = await (this.prisma as any).blogCategory.create({ data: { name: name.trim(), slug } });
    await this.audit(user.id, 'CREATE', 'BlogCategory', cat.id);
    return cat;
  }

  async deleteCategory(id: string, user: AuthenticatedUser) {
    await (this.prisma as any).blogCategory.delete({ where: { id } });
    await this.audit(user.id, 'DELETE', 'BlogCategory', id);
    return { success: true };
  }

  // ========= ADMIN BLOG =========
  async listAdminPosts() {
    return (this.prisma as any).blogPost.findMany({ orderBy: { createdAt: 'desc' }, include: { BlogCategory: true }, take: 200 });
  }

  async savePost(id: string | undefined, body: any, user: AuthenticatedUser) {
    const data: any = {
      title: body.title,
      slug: body.slug ? this.slugify(body.slug) : this.slugify(body.title || 'post'),
      excerpt: body.excerpt || '',
      content: body.content || '',
      featuredImage: body.featuredImage || null,
      galleryImages: body.galleryImages || [],
      author: body.author || user.name || user.email,
      categoryId: body.categoryId,
      tags: body.tags || [],
      status: body.status || 'DRAFT',
      publishDate: body.publishDate ? new Date(body.publishDate) : (body.status === 'PUBLISHED' ? new Date() : null),
      seoTitle: body.seoTitle || null,
      seoDescription: body.seoDescription || null,
      seoKeywords: body.seoKeywords || [],
      openGraphImage: body.openGraphImage || null,
      canonicalUrl: body.canonicalUrl || null,
      schemaMarkup: body.schemaMarkup || null,
    };

    let post;
    if (id) {
      post = await (this.prisma as any).blogPost.update({ where: { id }, data });
      await this.audit(user.id, 'UPDATE', 'BlogPost', id);
    } else {
      // Ensure slug unique
      let slug = data.slug;
      let counter = 1;
      while (await (this.prisma as any).blogPost.findUnique({ where: { slug } })) {
        slug = `${data.slug}-${counter++}`;
      }
      data.slug = slug;
      post = await (this.prisma as any).blogPost.create({ data });
      await this.audit(user.id, 'CREATE', 'BlogPost', post.id);
    }
    return post;
  }

  async deletePost(id: string, user: AuthenticatedUser) {
    await (this.prisma as any).blogPost.delete({ where: { id } });
    await this.audit(user.id, 'DELETE', 'BlogPost', id);
    return { success: true };
  }

  // ========= ADMIN GALLERY =========
  async listAdminGallery() {
    return (this.prisma as any).galleryItem.findMany({
      orderBy: [{ displayOrder: 'asc' }],
      include: {
        ContentMedia: {
          select: { id: true, originalName: true, contentType: true, status: true, publishedLocations: true },
        },
      },
      take: 200,
    });
  }

  async saveGalleryItem(id: string | undefined, body: any, user: AuthenticatedUser) {
    const data: any = {
      mediaId: body.mediaId,
      title: body.title || 'Gallery Item',
      description: body.description || '',
      category: body.category || 'GENERAL',
      displayOrder: body.displayOrder ?? 0,
      isVisible: body.isVisible ?? true,
    };
    if (!data.mediaId) throw new BadRequestException('mediaId required');
    const media = await (this.prisma as any).contentMedia.findUnique({ where: { id: data.mediaId } });
    if (!media || media.status !== 'AVAILABLE' || !media.publishedLocations.includes('gallery')) {
      throw new BadRequestException('Gallery media must pass malware scanning before publication.');
    }

    let item;
    if (id) {
      item = await (this.prisma as any).galleryItem.update({ where: { id }, data });
      await this.audit(user.id, 'UPDATE', 'GalleryItem', id);
    } else {
      item = await (this.prisma as any).galleryItem.create({ data });
      await this.audit(user.id, 'CREATE', 'GalleryItem', item.id);
    }
    return item;
  }

  async deleteGalleryItem(id: string, user: AuthenticatedUser) {
    await (this.prisma as any).galleryItem.delete({ where: { id } });
    await this.audit(user.id, 'DELETE', 'GalleryItem', id);
    return { success: true };
  }

  // ========= HOMEPAGE & SETTINGS =========
  async getPublicHomepage() {
    const setting = await (this.prisma as any).cmsSetting.findUnique({ where: { key: 'homepage' } });
    return setting?.value || { heroTitle: '', heroSubtitle: '' };
  }

  async getSetting(key: string) {
    const setting = await (this.prisma as any).cmsSetting.findUnique({ where: { key } });
    return setting?.value || null;
  }

  async saveSetting(key: string, value: unknown, user: AuthenticatedUser) {
    const setting = await (this.prisma as any).cmsSetting.upsert({
      where: { key },
      update: { value: value as any },
      create: { key, value: value as any },
    });
    await this.audit(user.id, 'SAVE_SETTING', 'CmsSetting', key, { key });
    return setting;
  }

  private validateMediaFile(file: Express.Multer.File | undefined): asserts file is Express.Multer.File {
    if (!file?.buffer?.length) throw new BadRequestException('A file is required.');
    if (file.size > 25 * 1024 * 1024) throw new BadRequestException('Media files must be 25 MiB or smaller.');

    const signatures: Record<string, (bytes: Buffer) => boolean> = {
      'image/jpeg': (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
      'image/png': (bytes) => bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
      'image/webp': (bytes) => bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP',
      'image/gif': (bytes) => ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6)),
      'application/pdf': (bytes) => bytes.toString('ascii', 0, 5) === '%PDF-',
      'video/mp4': (bytes) => bytes.toString('ascii', 4, 8) === 'ftyp',
    };
    // Sniff from bytes, don't trust client-sent mimetype (PowerShell/curl send octet-stream)
    const detected = (Object.keys(signatures) as Array<keyof typeof signatures>).find((t) => signatures[t](file.buffer));
    if (detected) (file as any).mimetype = detected;
    const signatureCheck = signatures[file.mimetype];
    if (!signatureCheck || !signatureCheck(file.buffer)) {
      throw new BadRequestException('Unsupported media type or file signature.');
    }
  }

  private safeFileName(fileName: string): string {
    return fileName.replace(/[\\/]/g, '_').replace(/[^\w.-]/g, '_').slice(0, 160) || 'uploaded-media';
  }
}

