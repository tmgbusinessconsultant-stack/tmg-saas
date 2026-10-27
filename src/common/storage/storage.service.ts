import * as fs from "fs";
import * as path from "path";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const useS3 = !!process.env.AWS_S3_BUCKET && process.env.AWS_S3_BUCKET !== "your-bucket" && process.env.AWS_ACCESS_KEY_ID;

let s3Client: S3Client | null = null;
if (useS3) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    endpoint: process.env.AWS_S3_ENDPOINT || undefined,
  });
}

export class StorageService {
  async saveFile(key: string, buffer: Buffer, mimetype: string) {
    // S3 optional
    if (useS3 && s3Client) {
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      }));
      return { storage: "s3", key, url: `s3://${process.env.AWS_S3_BUCKET}/${key}` };
    }
    // LOCAL default
    const filePath = path.join(UPLOAD_DIR, key.replace(/\//g, "_"));
    fs.writeFileSync(filePath, buffer);
    return { storage: "local", key, url: `/uploads/${key.replace(/\//g, "_")}`, fileData: buffer };
  }

  async getFile(key: string) {
    if (useS3 && s3Client) {
      const res = await s3Client.send(new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key }));
      return res.Body;
    }
    const filePath = path.join(UPLOAD_DIR, key.replace(/\//g, "_"));
    if (fs.existsSync(filePath)) return fs.readFileSync(filePath);
    throw new Error("File not found locally: " + filePath);
  }

  async deleteFile(key: string) {
    if (useS3 && s3Client) {
      await s3Client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key }));
      return;
    }
    const filePath = path.join(UPLOAD_DIR, key.replace(/\//g, "_"));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  isS3Enabled() { return useS3; }
}
