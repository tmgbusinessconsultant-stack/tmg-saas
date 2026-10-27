import { Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as fs from "fs";
import * as path from "path";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, GetObjectTaggingCommand } from "@aws-sdk/client-s3";

@Injectable()
export class ContentService {
  private s3Client?: S3Client;
  private readonly uploadDir = path.join(process.cwd(), "uploads");

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.uploadDir)) fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  private storageDriver() {
    // LOCAL PREFERRED - S3 optional
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

  private async writeStoredObject(key: string, body: Buffer, contentType: string, id?: string) {
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
    // S3 fallback
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
    // Local preferred - instant AVAILABLE, no scan needed
    if (this.storageDriver() === "local") {
      return { status: media.status || "AVAILABLE" };
    }
    // S3 scan logic
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

  private async audit(tx: any, userId: string, action: string, entityId: string, meta: any) {
    try {
      await tx.activityLog.create({ data: { userId, action, entity, entityId, meta } });
    } catch {}
  }
}
