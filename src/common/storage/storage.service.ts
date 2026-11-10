import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import { Injectable } from "@nestjs/common";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const PRIVATE_STORAGE_DIR = path.join(process.cwd(), "private-storage", "project-files");
if (!fs.existsSync(PRIVATE_STORAGE_DIR)) fs.mkdirSync(PRIVATE_STORAGE_DIR, { recursive: true });

function safeLocalName(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, "_");
}

@Injectable()
export class StorageService {
  // Default: LOCAL DISK in a private server folder (no external keys, no public URL).
  // Optional fallback (OFF by default): Cloudflare R2 only when explicitly configured.
  private readonly bucket = (process.env.R2_BUCKET || "").trim();
  private readonly endpoint = (process.env.R2_ENDPOINT || "").trim();
  private readonly accessKeyId = (process.env.R2_ACCESS_KEY_ID || "").trim();
  private readonly secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || "").trim();
  private readonly region = (process.env.R2_REGION || "auto").trim();
  private readonly useR2 = Boolean(this.bucket && this.endpoint && this.accessKeyId && this.secretAccessKey);
  private readonly s3Client: S3Client | null = this.useR2
    ? new S3Client({
        region: this.region || "auto",
        endpoint: this.endpoint,
        forcePathStyle: true,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      })
    : null;

  async saveFile(key: string, buffer: Buffer, contentType: string) {
    if (this.useR2 && this.s3Client) {
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType || "application/octet-stream",
      }));
      return { storage: "r2", key };
    }
    const filePath = path.join(PRIVATE_STORAGE_DIR, safeLocalName(key));
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buffer);
    return { storage: "local", key };
  }

  async getFileBuffer(key: string): Promise<Buffer> {
    if (this.useR2 && this.s3Client) {
      const res = await this.s3Client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      const body = res.Body as any;
      if (!body) throw new Error("Empty object body");
      if (Buffer.isBuffer(body)) return body;
      if (typeof body.transformToByteArray === "function") return Buffer.from(await body.transformToByteArray());
      const chunks: Buffer[] = [];
      for await (const chunk of body) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return Buffer.concat(chunks);
    }
    const filePath = path.join(PRIVATE_STORAGE_DIR, safeLocalName(key));
    if (!fs.existsSync(filePath)) throw new Error("File not found locally: " + filePath);
    return fs.readFileSync(filePath);
  }

  async deleteFile(key: string) {
    if (this.useR2 && this.s3Client) {
      await this.s3Client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
      return;
    }
    const filePath = path.join(PRIVATE_STORAGE_DIR, safeLocalName(key));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  getTempPath(prefix = "scan"): string {
    const dir = path.join(process.cwd(), "private-storage", "tmp");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, `${prefix}-${Date.now()}-${randomUUID()}`);
  }

  async cleanupTemp(filePath?: string | null) {
    if (!filePath) return;
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
  }

  isLocalMode() { return !this.useR2; }
  isR2Enabled() { return this.useR2; }
  isS3Enabled() { return this.useR2; }
}
