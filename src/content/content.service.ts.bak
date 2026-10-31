import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.service';
import { randomUUID } from 'crypto';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);
  constructor(private readonly prisma: PrismaService) {}

  private slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || `item-${Date.now()}`;
  }

  private async audit(actorId: string, action: string, entityType: string, entityId: string, detail?: any) {
    try {
      await (this.prisma as any).contentAuditLog.create({ data: { actorId, action, entityType, entityId, detail: detail || {} } });
    } catch {}
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
    return (this.prisma as any).galleryItem.findMany({
      where: { isVisible: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: { ContentMedia: true },
    });
  }

  // ========= PUBLIC MEDIA =========
  async listPublishedMedia(location?: string) {
    const where: any = { status: 'AVAILABLE' };
    if (location) where.publishedLocations = { has: location };
    return (this.prisma as any).contentMedia.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
  }

  async getPublishedMedia(id: string) {
    const media = await (this.prisma as any).contentMedia.findUnique({ where: { id } });
    if (!media || media.status !== 'AVAILABLE') throw new NotFoundException('Media not found');
    if (media.publishedLocations?.length === 0) throw new NotFoundException('Media not published');
    
    let body: Buffer;
    try {
      if (media.fileData) {
        // Try base64
        body = Buffer.from(media.fileData, 'base64');
        if (body.length < 10) body = Buffer.from(media.fileData);
      } else {
        throw new Error('No file data');
      }
    } catch {
      body = Buffer.from(media.fileData || '');
    }
    return { contentType: media.contentType, body };
  }

  // ========= ADMIN MEDIA =========
  async listMedia(search?: string, type?: string) {
    const where: any = {};
    if (search) where.originalName = { contains: search, mode: 'insensitive' };
    if (type) where.contentType = { contains: type, mode: 'insensitive' };
    return (this.prisma as any).contentMedia.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
  }

  async getAdminMediaPreview(id: string) {
    const media = await (this.prisma as any).contentMedia.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
    let body: Buffer;
    try {
      body = media.fileData ? Buffer.from(media.fileData, 'base64') : Buffer.from('');
      if (body.length < 10 && media.fileData) body = Buffer.from(media.fileData);
    } catch { body = Buffer.from(media.fileData || ''); }
    return { contentType: media.contentType, body };
  }

  async uploadMedia(file: Express.Multer.File, location: string, user: AuthenticatedUser) {
    if (!file) throw new BadRequestException('File required');
    const storageKey = `media/${randomUUID()}-${file.originalname}`;
    const fileData = file.buffer.toString('base64');
    const media = await (this.prisma as any).contentMedia.create({
      data: {
        uploadedById: user.id,
        storageKey,
        originalName: file.originalname,
        contentType: file.mimetype,
        size: BigInt(file.size),
        status: 'AVAILABLE',
        publishedLocations: location ? [location] : [],
        fileData,
      },
    });
    await this.audit(user.id, 'UPLOAD', 'ContentMedia', media.id, { location });
    return media;
  }

  async replaceMedia(id: string, file: Express.Multer.File, user: AuthenticatedUser) {
    if (!file) throw new BadRequestException('File required');
    const existing = await (this.prisma as any).contentMedia.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Media not found');
    const fileData = file.buffer.toString('base64');
    const updated = await (this.prisma as any).contentMedia.update({
      where: { id },
      data: {
        originalName: file.originalname,
        contentType: file.mimetype,
        size: BigInt(file.size),
        fileData,
        storageKey: `media/${randomUUID()}-${file.originalname}`,
      },
    });
    await this.audit(user.id, 'REPLACE', 'ContentMedia', id);
    return updated;
  }

  async updateMedia(id: string, locations: string[] | undefined, user: AuthenticatedUser) {
    const media = await (this.prisma as any).contentMedia.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
    const updated = await (this.prisma as any).contentMedia.update({
      where: { id },
      data: { publishedLocations: locations || [] },
    });
    await this.audit(user.id, 'UPDATE_LOCATIONS', 'ContentMedia', id, { locations });
    return updated;
  }

  async refreshMediaScan(id: string) {
    const media = await (this.prisma as any).contentMedia.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
    return { id, status: media.status, scanned: true };
  }

  async deleteMedia(id: string, user: AuthenticatedUser) {
    const media = await (this.prisma as any).contentMedia.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
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
    return (this.prisma as any).galleryItem.findMany({ orderBy: [{ displayOrder: 'asc' }], include: { ContentMedia: true }, take: 200 });
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
}
