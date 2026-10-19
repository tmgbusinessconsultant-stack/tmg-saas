import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectTaggingCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Prisma, type ContentMedia } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import * as sanitizeHtml from 'sanitize-html';
import sharp = require('sharp');
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.service';

const MAX_MEDIA_BYTES = 25 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 50_000_000;
const UPLOAD_FOLDERS = new Set(['blog', 'services', 'clients', 'gallery', 'documents']);
const PUBLISH_LOCATIONS = new Set(['homepage', 'blog', 'services', 'gallery', 'case-study', 'about']);
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/svg+xml', 'image/webp', 'image/gif', 'application/pdf', 'video/mp4',
]);
const ARTICLE_HTML = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'blockquote', 'strong', 'b', 'em', 'i',
    'u', 's', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'pre', 'code', 'hr', 'br', 'iframe',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    iframe: ['src', 'width', 'height', 'title', 'allow', 'allowfullscreen', 'frameborder', 'referrerpolicy'],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'nofollow noopener noreferrer' }),
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);
  private s3Client: S3Client | undefined;

  constructor(private readonly prisma: PrismaService) {}

  async listPublishedPosts() {
    const posts = await this.prisma.blogPost.findMany({
      where: {
        OR: [
          { status: 'PUBLISHED', OR: [{ publishDate: null }, { publishDate: { lte: new Date() } }] },
          { status: 'SCHEDULED', publishDate: { lte: new Date() } },
        ],
      },
      include: { category: { select: { name: true, slug: true } } },
      orderBy: [{ publishDate: 'desc' }, { createdAt: 'desc' }],
    });
    return posts.map((post) => this.publicPost(post));
  }

  async getPublishedPost(slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: {
        slug,
        OR: [
          { status: 'PUBLISHED', OR: [{ publishDate: null }, { publishDate: { lte: new Date() } }] },
          { status: 'SCHEDULED', publishDate: { lte: new Date() } },
        ],
      },
      include: { category: { select: { name: true, slug: true } } },
    });
    if (!post) throw new NotFoundException('Blog post not found.');
    return this.publicPost(post);
  }

  async listAdminPosts() {
    return this.prisma.blogPost.findMany({
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 500,
    });
  }

  async savePost(id: string | undefined, input: Record<string, unknown>, user: AuthenticatedUser) {
    const title = this.requiredText(input.title, 'Title', 180);
    const slug = this.slug(this.requiredText(input.slug, 'Slug', 180));
    const excerpt = this.requiredText(input.excerpt, 'Excerpt', 1000);
    const content = this.requiredText(input.content, 'Content', 100000);
    const categoryId = this.requiredText(input.categoryId, 'Category', 100);
    if (id && !await this.prisma.blogPost.findUnique({ where: { id }, select: { id: true } })) {
      throw new NotFoundException('Blog post not found.');
    }
    if (!await this.prisma.blogCategory.findUnique({ where: { id: categoryId }, select: { id: true } })) {
      throw new BadRequestException('Choose an existing blog category.');
    }
    const duplicateSlug = await this.prisma.blogPost.findFirst({
      where: { slug, ...(id ? { id: { not: id } } : {}) },
      select: { id: true },
    });
    if (duplicateSlug) throw new BadRequestException('This slug is already used by another article.');
    const author = typeof input.author === 'string' && input.author.trim()
      ? this.requiredText(input.author, 'Author', 120)
      : user.name;
    const status = input.status == null || input.status === 'DRAFT'
      ? 'DRAFT'
      : input.status === 'PUBLISHED' || input.status === 'SCHEDULED'
        ? input.status
        : null;
    if (!status) throw new BadRequestException('Choose a valid publication status.');
    const publishDate = input.publishDate ? new Date(String(input.publishDate)) : null;
    if (publishDate && Number.isNaN(publishDate.getTime())) {
      throw new BadRequestException('Choose a valid publication date.');
    }
    if (status === 'SCHEDULED' && !publishDate) {
      throw new BadRequestException('Choose a publication date to schedule an article.');
    }
    const tags = this.stringArray(input.tags, 'Tags', 30, 50);
    const seoKeywords = this.stringArray(input.seoKeywords, 'SEO keywords', 30, 80);
    const galleryImages = this.stringArray(input.galleryImages, 'Gallery images', 30, 1000);
    const featuredImage = this.optionalText(input.featuredImage, 1000);
    const openGraphImage = this.optionalText(input.openGraphImage, 1000);
    const cleanContent = sanitizeHtml(content, ARTICLE_HTML);
    await this.validatePublishedImages(
      [featuredImage, openGraphImage, ...galleryImages, ...this.htmlImageSources(cleanContent)]
        .filter((image): image is string => image !== null),
      'blog',
    );
    if (input.schemaMarkup != null && input.schemaMarkup !== '' && !isRecord(input.schemaMarkup)) {
      throw new BadRequestException('Schema markup must be a JSON object.');
    }
    const schemaMarkup = input.schemaMarkup == null || input.schemaMarkup === '' ? Prisma.DbNull : input.schemaMarkup as Prisma.InputJsonValue;
    const values = {
      title,
      slug,
      excerpt,
      content: cleanContent,
      featuredImage,
      galleryImages,
      author,
      categoryId,
      tags,
      status,
      publishDate,
      seoTitle: this.optionalText(input.seoTitle, 180),
      seoDescription: this.optionalText(input.seoDescription, 320),
      seoKeywords,
      openGraphImage,
      canonicalUrl: this.optionalUrl(input.canonicalUrl),
      schemaMarkup,
    };
    const post = await this.prisma.$transaction(async (tx) => {
      const saved = id
        ? await tx.blogPost.update({ where: { id }, data: values, include: { category: { select: { name: true, slug: true } } } })
        : await tx.blogPost.create({ data: values, include: { category: { select: { name: true, slug: true } } } });
      await this.audit(tx, user.id, id ? 'BLOG_POST_UPDATED' : 'BLOG_POST_CREATED', 'BlogPost', saved.id, { slug });
      return saved;
    });
    return post;
  }

  async deletePost(id: string, user: AuthenticatedUser) {
    const post = await this.prisma.blogPost.findUnique({ where: { id }, select: { id: true } });
    if (!post) throw new NotFoundException('Blog post not found.');
    await this.prisma.$transaction(async (tx) => {
      await tx.blogPost.delete({ where: { id } });
      await this.audit(tx, user.id, 'BLOG_POST_DELETED', 'BlogPost', id);
    });
    return { success: true };
  }

  listCategories() {
    return this.prisma.blogCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async createCategory(value: unknown, user: AuthenticatedUser) {
    const name = this.requiredText(value, 'Category name', 80);
    const slug = this.slug(name);
    const duplicateSlug = await this.prisma.blogCategory.findUnique({ where: { slug }, select: { id: true } });
    if (duplicateSlug) throw new BadRequestException('This category name is already in use.');
    return this.prisma.$transaction(async (tx) => {
      const category = await tx.blogCategory.create({ data: { name, slug } });
      await this.audit(tx, user.id, 'BLOG_CATEGORY_CREATED', 'BlogCategory', category.id, { name });
      return category;
    });
  }

  async deleteCategory(id: string, user: AuthenticatedUser) {
    const category = await this.prisma.blogCategory.findUnique({ where: { id }, select: { id: true } });
    if (!category) throw new NotFoundException('Blog category not found.');
    const posts = await this.prisma.blogPost.count({ where: { categoryId: id } });
    if (posts > 0) throw new BadRequestException('Reassign the category’s blog posts before deleting it.');
    await this.prisma.$transaction(async (tx) => {
      await tx.blogCategory.delete({ where: { id } });
      await this.audit(tx, user.id, 'BLOG_CATEGORY_DELETED', 'BlogCategory', id);
    });
    return { success: true };
  }

  async uploadMedia(file: Express.Multer.File | undefined, folder: string, user: AuthenticatedUser) {
    if (!file?.buffer?.length) throw new BadRequestException('Choose a file to upload.');
    if (file.size > MAX_MEDIA_BYTES) throw new BadRequestException('Files must be 25 MB or smaller.');
    if (!UPLOAD_FOLDERS.has(folder)) throw new BadRequestException('Choose a valid media folder.');
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) throw new BadRequestException('This file type is not supported.');
    const contentType = this.detectContentType(file);
    const safeName = file.originalname.replace(/[^\w.-]+/g, '_').slice(0, 160) || 'upload';
    const id = randomUUID();
    const storageKey = `uploads/${folder}/${id}/${safeName}`;
    let body = file.buffer;
    let storedType = contentType;

    if (contentType === 'image/svg+xml') {
      const svg = body.toString('utf8');
      if (!/<svg(?:\s|>)/i.test(svg) || /<script|<foreignObject|\bon\w+\s*=|javascript:|<\?xml-stylesheet/i.test(svg)) {
        throw new BadRequestException('This SVG contains unsupported or unsafe content.');
      }
      body = Buffer.from(sanitizeHtml(svg, {
        allowedTags: ['svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'defs', 'linearGradient', 'radialGradient', 'stop', 'title', 'desc', 'use'],
        allowedAttributes: {
          '*': ['viewBox', 'width', 'height', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'fill', 'stroke', 'stroke-width', 'transform', 'points', 'offset', 'stop-color', 'xmlns', 'id', 'class', 'opacity'],
        },
        allowedSchemes: [],
      }));
    } else if (contentType.startsWith('image/') && contentType !== 'image/gif') {
      try {
        body = await sharp(body, { limitInputPixels: MAX_IMAGE_PIXELS }).rotate().resize({
          width: 2400,
          height: 2400,
          fit: 'inside',
          withoutEnlargement: true,
        }).webp({ quality: 82 }).toBuffer();
        storedType = 'image/webp';
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Image optimization failed (${file.mimetype}, ${file.size} bytes): ${reason}`);
        if (/exceeds pixel limit/i.test(reason)) {
          throw new BadRequestException('This image exceeds the 50-megapixel limit. Resize it and try again.');
        }
        throw new BadRequestException('The image could not be decoded or optimized.');
      }
    }

    await this.writeStoredObject(storageKey, body, storedType, id);
    let media: ContentMedia;
    try {
      media = await this.prisma.$transaction(async (tx) => {
        const created = await tx.contentMedia.create({
          data: {
            id,
            uploadedById: user.id,
            storageKey,
            originalName: safeName,
            contentType: storedType,
            size: BigInt(body.byteLength),
            status: this.storageDriver() === 'local' ? 'UNSCANNED' : 'SCANNING',
          },
        });
        await this.audit(tx, user.id, 'MEDIA_UPLOADED', 'ContentMedia', id, {
          name: safeName,
          contentType: storedType,
          folder,
        });
        return created;
      });
    } catch (error) {
      try {
        await this.deleteStoredObject(storageKey);
      } catch (cleanupError) {
        this.logger.error(`Failed to clean up untracked CMS upload ${id}.`, cleanupError);
        throw new ServiceUnavailableException('Media could not be saved and the uploaded object could not be removed. Contact support.');
      }
      throw error;
    }
    return this.adminMedia(media);
  }

  async listMedia(search?: string, type?: string) {
    const normalizedType = type?.trim();
    const where: Prisma.ContentMediaWhereInput = {
      ...(normalizedType ? { contentType: { startsWith: normalizedType } } : {}),
      ...(search?.trim() ? { originalName: { contains: search.trim(), mode: 'insensitive' } } : {}),
    };
    const [rows, posts, galleryItems, settings] = await Promise.all([
      this.prisma.contentMedia.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
      this.prisma.blogPost.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          publishDate: true,
          featuredImage: true,
          openGraphImage: true,
          galleryImages: true,
          content: true,
        },
        take: 1000,
      }),
      this.prisma.galleryItem.findMany({
        select: { id: true, title: true, mediaId: true, isVisible: true },
        take: 1000,
      }),
      this.prisma.cmsSetting.findMany({
        where: { key: { in: ['homepage', 'seo'] } },
        select: { key: true, value: true },
      }),
    ]);

    const usages = new Map<string, Array<{ entityType: string; entityId: string; label: string; href: string; published: boolean }>>();
    const addUsage = (mediaId: string, usage: { entityType: string; entityId: string; label: string; href: string; published: boolean }) => {
      const current = usages.get(mediaId) ?? [];
      if (!current.some((item) => item.entityType === usage.entityType && item.entityId === usage.entityId && item.label === usage.label)) {
        current.push(usage);
        usages.set(mediaId, current);
      }
    };
    const recordUrls = (
      values: Array<string | null>,
      usage: { entityType: string; entityId: string; label: string; href: string; published: boolean },
    ) => {
      for (const value of values) {
        if (!value) continue;
        const mediaId = this.mediaIdFromUrl(value);
        if (mediaId) addUsage(mediaId, usage);
      }
    };

    for (const post of posts) {
      const usage = {
        entityType: 'BLOG_POST',
        entityId: post.id,
        label: `Blog post: ${post.title}`,
        href: `/blog/${encodeURIComponent(post.slug)}`,
        published: (
          post.status === 'PUBLISHED' || post.status === 'SCHEDULED'
        ) && (!post.publishDate || post.publishDate <= new Date()),
      };
      recordUrls([post.featuredImage, post.openGraphImage, ...post.galleryImages], usage);
      for (const source of this.htmlImageSources(post.content)) recordUrls([source], usage);
    }
    for (const item of galleryItems) {
      addUsage(item.mediaId, {
        entityType: 'GALLERY_ENTRY',
        entityId: item.id,
        label: `Gallery entry: ${item.title}`,
        href: '/gallery',
        published: item.isVisible,
      });
    }
    for (const setting of settings) {
      const values: Array<{ path: string; url: string }> = [];
      const visit = (value: unknown, path: string) => {
        if (typeof value === 'string') {
          values.push({ path, url: value });
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => visit(item, `${path}[${index + 1}]`));
        } else if (isRecord(value)) {
          for (const [key, item] of Object.entries(value)) visit(item, path ? `${path}.${key}` : key);
        }
      };
      visit(setting.value, setting.key);
      for (const entry of values) {
        const mediaId = this.mediaIdFromUrl(entry.url);
        if (!mediaId) continue;
        const isHero = setting.key === 'homepage' && entry.path === 'hero.imageUrl';
        addUsage(mediaId, {
          entityType: isHero ? 'HOMEPAGE_HERO' : 'CMS_SETTING',
          entityId: setting.key,
          label: isHero ? 'Homepage hero image' : `${setting.key} content: ${entry.path}`,
          href: setting.key === 'homepage' ? '/' : '/',
          published: true,
        });
      }
    }

    return Promise.all(rows.map(async (media) => ({
      ...await this.adminMedia(media),
      usages: usages.get(media.id) ?? [],
    })));
  }

  async replaceMedia(id: string, file: Express.Multer.File | undefined, user: AuthenticatedUser) {
    const existing = await this.prisma.contentMedia.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Media item not found.');
    const folder = existing.storageKey.split('/')[1];
    if (!folder || !UPLOAD_FOLDERS.has(folder)) {
      throw new ServiceUnavailableException('The media storage path is invalid. Contact support.');
    }
    const replacement = await this.uploadMedia(file, folder, user);
    const temporary = await this.prisma.contentMedia.findUnique({ where: { id: replacement.id } });
    if (!temporary) throw new ServiceUnavailableException('Replacement media could not be found after upload.');

    let updated: ContentMedia;
    try {
      updated = await this.prisma.$transaction(async (tx) => {
        await tx.contentMedia.delete({ where: { id: temporary.id } });
        const result = await tx.contentMedia.update({
          where: { id },
          data: {
            storageKey: temporary.storageKey,
            originalName: temporary.originalName,
            contentType: temporary.contentType,
            size: temporary.size,
            status: this.storageDriver() === 'local' ? 'UNSCANNED' : 'SCANNING',
            publishedLocations: existing.publishedLocations,
          },
        });
        await this.audit(tx, user.id, 'MEDIA_REPLACED', 'ContentMedia', id, { name: temporary.originalName });
        return result;
      });
    } catch (error) {
      try {
        await this.deleteMedia(temporary.id, user);
      } catch (cleanupError) {
        this.logger.error(`Failed to clean up replacement media ${temporary.id}.`, cleanupError);
        throw new ServiceUnavailableException('Media replacement failed and the new upload could not be removed. Contact support.');
      }
      throw error;
    }

    try {
      await this.deleteStoredObject(existing.storageKey);
    } catch (error) {
      this.logger.error(`Failed to remove replaced object ${existing.id}.`, error);
      throw new ServiceUnavailableException('The new media is being scanned, but the old object could not be removed. Contact support.');
    }
    return this.adminMedia(updated);
  }

  async updateMedia(id: string, locations: string[] | undefined, user: AuthenticatedUser) {
    if (!Array.isArray(locations) || locations.some((item) => !PUBLISH_LOCATIONS.has(item))) {
      throw new BadRequestException('Choose valid publishing locations.');
    }
    const media = await this.prisma.contentMedia.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media item not found.');
    if (locations.length > 0 && !media.contentType.startsWith('image/')) {
      throw new BadRequestException('Only scanned images can be published to website sections. PDFs and videos remain in the Media Library.');
    }
    if (locations.length > 0 && this.storageDriver() === 'local') {
      throw new ServiceUnavailableException('Local media storage does not run malware scans and cannot publish images. Configure private S3 storage with malware scanning enabled.');
    }
    if (locations.length > 0 && media.status !== 'AVAILABLE') {
      throw new BadRequestException('Media can only be published after its malware scan is clean.');
    }
    const requiredLocations = await this.requiredMediaLocations(id);
    if ([...requiredLocations].some((location) => !locations.includes(location))) {
      throw new BadRequestException('This media is used by public content. Remove those references before unpublishing its location.');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.contentMedia.update({ where: { id }, data: { publishedLocations: [...new Set(locations)] } });
      await this.audit(tx, user.id, 'MEDIA_PUBLISHING_CHANGED', 'ContentMedia', id, { locations });
      return result;
    });
    return this.adminMedia(updated);
  }

  async refreshMediaScan(id: string) {
    const media = await this.prisma.contentMedia.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media item not found.');
    if (media.status !== 'SCANNING') return { status: media.status };
    if (this.storageDriver() === 'local') return { status: media.status };
    const tags = await this.s3().send(new GetObjectTaggingCommand({
      Bucket: this.bucketName(),
      Key: media.storageKey,
    }));
    const key = process.env.AWS_S3_SCAN_TAG_KEY?.trim() || 'GuardDutyMalwareScanStatus';
    const scan = tags.TagSet?.find((tag) => tag.Key === key)?.Value;
    const status = scan === 'NO_THREATS_FOUND' ? 'AVAILABLE'
      : scan === 'THREATS_FOUND' || scan === 'UNSUPPORTED' ? 'REJECTED'
        : undefined;
    if (!status) return { status: media.status };
    const updated = await this.prisma.contentMedia.update({
      where: { id, status: 'SCANNING' },
      data: { status },
    });
    return { status: updated.status };
  }

  async deleteMedia(id: string, user: AuthenticatedUser) {
    const media = await this.prisma.contentMedia.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media item not found.');
    if ((await this.requiredMediaLocations(id)).size > 0) {
      throw new BadRequestException('Remove this media from public content before deleting it.');
    }
    await this.deleteStoredObject(media.storageKey);
    await this.prisma.$transaction(async (tx) => {
      await tx.contentMedia.delete({ where: { id } });
      await this.audit(tx, user.id, 'MEDIA_DELETED', 'ContentMedia', id, { name: media.originalName });
    });
    return { success: true };
  }

  async getPublishedMedia(id: string) {
    if (this.storageDriver() === 'local') {
      throw new NotFoundException('Public media is unavailable because local storage does not run malware scans.');
    }
    const media = await this.prisma.contentMedia.findUnique({ where: { id } });
    if (!media || media.status !== 'AVAILABLE' || !media.contentType.startsWith('image/') || media.publishedLocations.length === 0) {
      throw new NotFoundException('Media item not found.');
    }
    const body = await this.readStoredObject(media.storageKey);
    return { contentType: media.contentType, body };
  }

  async getAdminMediaPreview(id: string) {
    const media = await this.prisma.contentMedia.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media item not found.');
    const body = await this.readStoredObject(media.storageKey);
    return { contentType: media.contentType, body };
  }

  async listPublishedMedia(location: string) {
    if (!PUBLISH_LOCATIONS.has(location)) throw new BadRequestException('Choose a valid publishing location.');
    if (this.storageDriver() === 'local') return [];
    const media = await this.prisma.contentMedia.findMany({
      where: {
        status: 'AVAILABLE',
        contentType: { startsWith: 'image/' },
        publishedLocations: { has: location },
      },
      select: { id: true, originalName: true, contentType: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return media.map((item) => ({ ...item, url: this.mediaUrl(item.id) }));
  }

  async listGallery() {
    if (this.storageDriver() === 'local') return [];
    return this.prisma.galleryItem.findMany({
      where: { isVisible: true, media: { status: 'AVAILABLE', publishedLocations: { has: 'gallery' } } },
      include: { media: { select: { id: true, contentType: true } } },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    }).then((items) => items.map((item) => ({ ...item, image: this.mediaUrl(item.mediaId) })));
  }

  async listAdminGallery() {
    return this.prisma.galleryItem.findMany({
      include: { media: { select: { id: true, originalName: true, contentType: true, status: true } } },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async saveGalleryItem(id: string | undefined, input: Record<string, unknown>, user: AuthenticatedUser) {
    if (id) {
      const existing = await this.prisma.galleryItem.findUnique({ where: { id }, select: { id: true } });
      if (!existing) throw new NotFoundException('Gallery item not found.');
    }
    const mediaId = this.requiredText(input.mediaId, 'Image', 100);
    const media = await this.prisma.contentMedia.findUnique({ where: { id: mediaId } });
    if (!media || media.status !== 'AVAILABLE' || !media.publishedLocations.includes('gallery')) {
      throw new BadRequestException('Select an available image published to the gallery.');
    }
    const title = this.requiredText(input.title, 'Title', 180);
    const description = this.optionalText(input.description, 2000) ?? '';
    const category = this.requiredText(input.category, 'Category', 80);
    const displayOrder = Number(input.displayOrder ?? 0);
    if (!Number.isSafeInteger(displayOrder) || displayOrder < 0) {
      throw new BadRequestException('Display order must be a non-negative whole number.');
    }
    const isVisible = input.isVisible !== false;
    return this.prisma.$transaction(async (tx) => {
      const item = id
        ? await tx.galleryItem.update({ where: { id }, data: { mediaId, title, description, category, displayOrder, isVisible } })
        : await tx.galleryItem.create({ data: { mediaId, title, description, category, displayOrder, isVisible } });
      await this.audit(tx, user.id, id ? 'GALLERY_ITEM_UPDATED' : 'GALLERY_ITEM_CREATED', 'GalleryItem', item.id);
      return item;
    });
  }

  async deleteGalleryItem(id: string, user: AuthenticatedUser) {
    const item = await this.prisma.galleryItem.findUnique({ where: { id }, select: { id: true } });
    if (!item) throw new NotFoundException('Gallery item not found.');
    await this.prisma.$transaction(async (tx) => {
      await tx.galleryItem.delete({ where: { id } });
      await this.audit(tx, user.id, 'GALLERY_ITEM_DELETED', 'GalleryItem', id);
    });
    return { success: true };
  }

  async getSetting(key: string) {
    this.assertSettingKey(key);
    const setting = await this.prisma.cmsSetting.findUnique({ where: { key } });
    return setting?.value ?? null;
  }

  async getPublicHomepage() {
    const value: unknown = await this.getSetting('homepage');
    if (!isRecord(value)) return value;
    const testimonials = isRecord(value.testimonials) ? value.testimonials : {};
    const items = Array.isArray(testimonials.items)
      ? testimonials.items.filter((item) => isRecord(item)
        && item.approved === true
        && typeof item.quote === 'string' && item.quote.trim()
        && typeof item.clientName === 'string' && item.clientName.trim()
        && Number.isInteger(item.rating) && Number(item.rating) >= 1 && Number(item.rating) <= 5)
      : [];
    const statistics = Array.isArray(value.statistics)
      ? value.statistics.filter((item) => isRecord(item)
        && typeof item.value === 'string' && typeof item.label === 'string')
      : [];
    return { ...value, testimonials: { ...testimonials, items }, statistics };
  }

  async saveSetting(key: string, value: unknown, user: AuthenticatedUser) {
    this.assertSettingKey(key);
    if (!isRecord(value)) throw new BadRequestException('Content settings must be a JSON object.');
    const serialized = JSON.stringify(value);
    if (serialized.length > 50000) throw new BadRequestException('Content settings must not exceed 50 KB.');
    if (key === 'homepage') this.validateHomepageTestimonials(value);
    await this.validateSettingUrls(value, key);
    const updated = await this.prisma.$transaction(async (tx) => {
      const setting = await tx.cmsSetting.upsert({
        where: { key },
        create: { key, value: value as Prisma.InputJsonValue, updatedAt: new Date() },
        update: { value: value as Prisma.InputJsonValue },
      });
      await this.audit(tx, user.id, 'CMS_SETTING_UPDATED', 'CmsSetting', key);
      return setting;
    });
    return updated.value;
  }

  private async audit(
    client: PrismaService | Prisma.TransactionClient,
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    detail?: Prisma.InputJsonValue,
  ) {
    const contentAudit = await client.contentAuditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        ...(detail === undefined ? {} : { detail }),
      },
    });
    await client.activityLog.create({
      data: {
        actorId,
        action,
        targetId: entityId,
        detail: {
          entityType,
          ...(detail === undefined ? {} : { detail }),
        } satisfies Prisma.InputJsonValue,
      },
    });
    return contentAudit;
  }

  private detectContentType(file: Express.Multer.File): string {
    const bytes = file.buffer;
    const type = file.mimetype;
    const signatures: Record<string, boolean> = {
      'image/jpeg': bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
      'image/png': bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      'image/webp': bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP',
      'image/gif': bytes.toString('ascii', 0, 3) === 'GIF',
      'application/pdf': bytes.toString('ascii', 0, 5) === '%PDF-',
      'video/mp4': bytes.length >= 12 && bytes.toString('ascii', 4, 8) === 'ftyp',
    };
    if (type === 'image/svg+xml') return type;
    if (!signatures[type]) throw new BadRequestException('The uploaded file contents do not match its declared type.');
    return type;
  }

  private publicPost(post: { content: string; featuredImage: string | null; openGraphImage: string | null; galleryImages: string[]; [key: string]: unknown }) {
    return {
      ...post,
      featuredImage: post.featuredImage,
      openGraphImage: post.openGraphImage,
      galleryImages: post.galleryImages,
    };
  }

  private async adminMedia(media: ContentMedia) {
    const storageDriver = this.storageDriver();
    return {
      ...media,
      size: media.size.toString(),
      scanStatus: media.status === 'SCANNING'
        ? 'PENDING'
        : media.status === 'REJECTED'
          ? 'FAILED'
          : media.status === 'AVAILABLE' && storageDriver === 's3'
            ? 'PASSED'
            : 'NOT_SCANNED',
      url: this.mediaUrl(media.id),
      previewUrl: storageDriver === 'local'
        ? `/admin/content/media/${encodeURIComponent(media.id)}/preview`
        : await getSignedUrl(this.s3(), new GetObjectCommand({
          Bucket: this.bucketName(),
          Key: media.storageKey,
        }), { expiresIn: 300 }),
      locations: media.publishedLocations,
    };
  }

  private mediaUrl(id: string) {
    return `/content/media/${encodeURIComponent(id)}/file`;
  }

  private requiredText(value: unknown, label: string, maximum: number): string {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum) {
      throw new BadRequestException(`${label} is required and must be ${maximum} characters or fewer.`);
    }
    return value.trim();
  }

  private optionalText(value: unknown, maximum: number): string | null {
    if (value == null || value === '') return null;
    if (typeof value !== 'string' || value.trim().length > maximum) {
      throw new BadRequestException(`Text fields must be ${maximum} characters or fewer.`);
    }
    return value.trim();
  }

  private optionalUrl(value: unknown): string | null {
    const url = this.optionalText(value, 2000);
    if (!url) return null;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('scheme');
      return parsed.toString();
    } catch {
      throw new BadRequestException('Canonical URL must be a valid HTTP or HTTPS URL.');
    }
  }

  private stringArray(value: unknown, label: string, maximumCount: number, maximumLength: number): string[] {
    if (value == null) return [];
    if (!Array.isArray(value) || value.length > maximumCount || value.some(
      (item) => typeof item !== 'string' || !item.trim() || item.trim().length > maximumLength,
    )) {
      throw new BadRequestException(`${label} must be a list of up to ${maximumCount} values.`);
    }
    return [...new Set(value.map((item: string) => item.trim()))];
  }

  private slug(value: string): string {
    const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!slug) throw new BadRequestException('Slug must include letters or numbers.');
    return slug;
  }

  private assertSettingKey(key: string) {
    if (key !== 'homepage' && key !== 'seo') throw new NotFoundException('Content setting not found.');
  }

  private async validateSettingUrls(value: Record<string, unknown>, setting: string) {
    const imageReferences: string[] = [];
    const visit = (current: unknown) => {
      if (Array.isArray(current)) {
        current.forEach(visit);
        return;
      }
      if (!isRecord(current)) return;
      for (const [key, child] of Object.entries(current)) {
        if (typeof child === 'string' && /(?:href|image|url)$/i.test(key) && child.trim()) {
          if (/href$/i.test(key)) this.validateHref(child);
          else {
            this.validateAbsoluteUrlOrMediaPath(child);
            imageReferences.push(child);
          }
        } else {
          visit(child);
        }
      }
    };
    visit(value);
    if (setting === 'homepage') await this.validatePublishedImages(imageReferences, 'homepage');
    if (setting === 'seo') await this.validatePublishedImages(imageReferences, 'homepage');
  }

  private validateHomepageTestimonials(value: Record<string, unknown>) {
    if (value.testimonials === undefined) return;
    if (!isRecord(value.testimonials) || !Array.isArray(value.testimonials.items)) {
      throw new BadRequestException('Homepage testimonials must be a list.');
    }
    for (const testimonial of value.testimonials.items) {
      if (!isRecord(testimonial)) throw new BadRequestException('Each testimonial must be an object.');
      const { quote, clientName, company, photoUrl, rating, approved } = testimonial;
      if (typeof quote !== 'string' || quote.length > 2000
        || typeof clientName !== 'string' || clientName.length > 120
        || typeof company !== 'string' || company.length > 160
        || typeof photoUrl !== 'string'
        || !Number.isInteger(rating) || Number(rating) < 1 || Number(rating) > 5
        || typeof approved !== 'boolean') {
        throw new BadRequestException('Testimonials need a valid review, client details, photo URL, 1-5 rating, and approval status.');
      }
      if (approved && (!quote.trim() || !clientName.trim())) {
        throw new BadRequestException('Approved testimonials must include a review and client name.');
      }
    }
  }

  private validateHref(value: string) {
    const href = value.trim();
    if (href.startsWith('/') && !href.startsWith('//')) return;
    try {
      const url = new URL(href);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('scheme');
    } catch {
      throw new BadRequestException('Links must use an internal path or an HTTP(S) URL.');
    }
  }

  private validateAbsoluteUrlOrMediaPath(value: string) {
    const path = this.mediaIdFromUrl(value);
    if (path) return;
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('scheme');
    } catch {
      throw new BadRequestException('Image and URL fields must use an HTTP(S) URL or a Media Library URL.');
    }
  }

  private async validatePublishedImages(urls: string[], location: string) {
    for (const url of urls) {
      this.validateAbsoluteUrlOrMediaPath(url);
      const id = this.mediaIdFromUrl(url);
      if (!id) continue;
      if (this.storageDriver() === 'local') {
        throw new BadRequestException('Local media storage does not run malware scans. Configure private S3 storage with malware scanning before publishing Media Library images.');
      }
      const media = await this.prisma.contentMedia.findUnique({
        where: { id },
        select: { status: true, contentType: true, publishedLocations: true },
      });
      if (!media || media.status !== 'AVAILABLE' || !media.contentType.startsWith('image/') || !media.publishedLocations.includes(location)) {
        throw new BadRequestException(`Select a clean Media Library file published to ${location}.`);
      }
    }
  }

  private async requiredMediaLocations(id: string): Promise<Set<string>> {
    const url = this.mediaUrl(id);
    const [post, galleryItems, settings] = await Promise.all([
      this.prisma.blogPost.findFirst({
        where: {
          OR: [
            { featuredImage: { contains: url } },
            { openGraphImage: { contains: url } },
            { galleryImages: { has: url } },
            { content: { contains: url } },
          ],
        },
        select: { id: true },
      }),
      this.prisma.galleryItem.count({ where: { mediaId: id } }),
      this.prisma.cmsSetting.findMany({ where: { key: { in: ['homepage', 'seo'] } }, select: { key: true, value: true } }),
    ]);
    const required = new Set<string>();
    if (post) required.add('blog');
    if (galleryItems > 0) required.add('gallery');
    for (const setting of settings) {
      if (JSON.stringify(setting.value).includes(url)) required.add('homepage');
    }
    return required;
  }

  private mediaIdFromUrl(value: string): string | null {
    try {
      const path = value.startsWith('/') ? value : new URL(value).pathname;
      const match = path.match(/\/content\/media\/([^/]+)\/file\/?$/);
      return match ? decodeURIComponent(match[1]) : null;
    } catch {
      return null;
    }
  }

  private htmlImageSources(html: string): string[] {
    return [...html.matchAll(/<img\b[^>]*\bsrc=(?:"([^"]*)"|'([^']*)')[^>]*>/gi)]
      .map((match) => match[1] ?? match[2])
      .filter(Boolean);
  }

  private storageDriver(): 'local' | 's3' {
    const driver = process.env.STORAGE_DRIVER?.trim().toLowerCase() || 's3';
    if (driver !== 'local' && driver !== 's3') {
      throw new ServiceUnavailableException('STORAGE_DRIVER must be either "local" or "s3".');
    }
    return driver;
  }

  private localStoragePath(storageKey: string): string {
    const root = resolve(process.env.LOCAL_STORAGE_DIR?.trim() || 'storage/cms');
    const filePath = resolve(root, storageKey);
    if (!filePath.startsWith(`${root}${sep}`)) {
      throw new ServiceUnavailableException('The media storage path is invalid. Contact support.');
    }
    return filePath;
  }

  private async writeStoredObject(storageKey: string, body: Buffer, contentType: string, id: string) {
    if (this.storageDriver() === 'local') {
      const filePath = this.localStoragePath(storageKey);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, body, { flag: 'wx' });
      return;
    }
    await this.s3().send(new PutObjectCommand({
      Bucket: this.bucketName(),
      Key: storageKey,
      Body: body,
      ContentType: contentType,
      Metadata: { mediaid: id },
      ServerSideEncryption: 'AES256',
    }));
  }

  private async readStoredObject(storageKey: string): Promise<Uint8Array> {
    if (this.storageDriver() === 'local') {
      try {
        return await readFile(this.localStoragePath(storageKey));
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
          throw new NotFoundException('Media item not found.');
        }
        throw error;
      }
    }
    const response = await this.s3().send(new GetObjectCommand({
      Bucket: this.bucketName(),
      Key: storageKey,
    }));
    if (!response.Body) throw new NotFoundException('Media item not found.');
    return response.Body.transformToByteArray();
  }

  private async deleteStoredObject(storageKey: string) {
    if (this.storageDriver() === 'local') {
      await unlink(this.localStoragePath(storageKey));
      return;
    }
    await this.s3().send(new DeleteObjectCommand({ Bucket: this.bucketName(), Key: storageKey }));
  }

  private bucketName() {
    const value = process.env.AWS_S3_BUCKET?.trim();
    if (!value) throw new ServiceUnavailableException('AWS_S3_BUCKET is not configured.');
    return value;
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
      ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
    });
    return this.s3Client;
  }
}
