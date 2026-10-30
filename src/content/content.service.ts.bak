import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as fs from "fs";
import * as path from "path";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectTaggingCommand } from "@aws-sdk/client-s3";

@Injectable()
export class ContentService {
  private s3Client?: S3Client;
  private readonly uploadDir = path.join(process.cwd(), "uploads");

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.uploadDir)) fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  private storageDriver() {
    const hasS3 = process.env.AWS_S3_BUCKET && process.env.AWS_S3_BUCKET.length > 5 && !process.env.AWS_S3_BUCKET.includes("your-bucket");
    if (hasS3 && process.env.STORAGE_MODE === "s3") return "s3";
    return "local";
  }

  private s3() {
    if (!this.s3Client) {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
        endpoint: process.env.AWS_S3_ENDPOINT || undefined,
      });
    }
    return this.s3Client;
  }

  private async writeStoredObject(key: string, body: Buffer, contentType: string) {
    if (this.storageDriver() === "s3") {
      await this.s3().send(new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: body,
        ContentType: contentType,
      }));
    } else {
      const filePath = path.join(this.uploadDir, key.replace(/\//g, "_"));
      fs.writeFileSync(filePath, body);
    }
  }

  private async deleteStoredObject(key: string) {
    if (this.storageDriver() === "s3") {
      await this.s3().send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key }));
    } else {
      const filePath = path.join(this.uploadDir, key.replace(/\//g, "_"));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }

  // ===== ADMIN METHODS =====
  async listMedia() {
    return this.prisma.contentMedia.findMany({ orderBy: { createdAt: "desc" } });
  }

  async getMediaFile(id: string) {
    const media = await this.prisma.contentMedia.findUnique({ where: { id } });
    if (!media) throw new NotFoundException("Media not found");
    if (this.storageDriver() === "local") {
      if (media.fileData) return { data: media.fileData, contentType: media.contentType };
      const filePath = path.join(this.uploadDir, media.storageKey.replace(/\//g, "_"));
      if (fs.existsSync(filePath)) {
        return { data: fs.readFileSync(filePath), contentType: media.contentType };
      }
    }
    return media;
  }

  async createMedia(data: any, file: Express.Multer.File) {
    const storageKey = `uploads/content/${Date.now()}_${file.originalname}`;
    await this.writeStoredObject(storageKey, file.buffer, file.mimetype);
    return this.prisma.contentMedia.create({
      data: {
        originalName: file.originalname,
        contentType: file.mimetype,
        size: file.size,
        storageKey,
        fileData: this.storageDriver() === "local" ? file.buffer : undefined,
        status: "AVAILABLE",
      },
    });
  }

  async deleteMedia(id: string) {
    const existing = await this.prisma.contentMedia.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Not found");
    await this.deleteStoredObject(existing.storageKey);
    return this.prisma.contentMedia.delete({ where: { id } });
  }

  async checkScanStatus(media: any) {
    if (this.storageDriver() === "local") return { status: media.status || "AVAILABLE" };
    try {
      const tags = await this.s3().send(new GetObjectTaggingCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: media.storageKey,
      }));
      const key = process.env.AWS_S3_SCAN_TAG_KEY?.trim() || "GuardDutyMalwareScanStatus";
      const tag = tags.TagSet?.find(t => t.Key === key);
      return { status: tag?.Value || media.status };
    } catch {
      return { status: media.status };
    }
  }

  // ===== PUBLIC METHODS - THIS WAS MISSING! =====
  async getPublicHomepage() {
    try {
      // Try to get from settings, fallback to empty structure
      const settings = await this.prisma.contentSetting.findMany().catch(() => []);
      const homepage = settings.find((s: any) => s.key === "homepage");
      if (homepage?.value) return homepage.value;
      return {
        hero: { title: "TMG Business Consulting", subtitle: "Your Growth Partner" },
        services: [],
        settings: settings,
      };
    } catch (e) {
      // If table doesn't exist, return fallback so frontend doesn't crash
      return {
        hero: { title: "TMG Business Consulting", subtitle: "Your Growth Partner" },
        services: [],
      };
    }
  }

  async listPublishedMedia() {
    try {
      return await this.prisma.contentMedia.findMany({
        where: { status: "AVAILABLE" },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    } catch {
      return [];
    }
  }

  async listPublishedPosts() {
    try {
      // Check if blog table exists
      if ((this.prisma as any).blogPost) {
        return await (this.prisma as any).blogPost.findMany({
          where: { published: true },
          orderBy: { createdAt: "desc" },
        });
      }
      if ((this.prisma as any).contentBlog) {
        return await (this.prisma as any).contentBlog.findMany({
          where: { status: "PUBLISHED" },
          orderBy: { createdAt: "desc" },
        });
      }
      return [];
    } catch {
      return [];
    }
  }

  async getPublishedPostBySlug(slug: string) {
    try {
      if ((this.prisma as any).blogPost) {
        return await (this.prisma as any).blogPost.findFirst({ where: { slug } });
      }
      return null;
    } catch {
      return null;
    }
  }

  async listPublishedGallery() {
    try {
      if ((this.prisma as any).contentGallery) {
        return await (this.prisma as any).contentGallery.findMany({
          orderBy: { createdAt: "desc" },
        });
      }
      return [];
    } catch {
      return [];
    }
  }

  async getPublicSeo() {
    try {
      const settings = await this.prisma.contentSetting.findMany().catch(() => []);
      return settings.filter((s: any) => s.key.startsWith("seo"));
    } catch {
      return [];
    }
  }

  async getContentMedia() {
    return this.listPublishedMedia();
  }
}
