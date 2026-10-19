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
import { randomUUID } from 'node:crypto';
import { OfficeParser, type SupportedFileType } from 'officeparser';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.service';

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_LENGTH = 500_000;
const ALLOWED_EXTENSIONS = new Set(['pdf', 'docx', 'xlsx', 'csv', 'txt']);

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);
  private s3Client: S3Client | undefined;

  constructor(private readonly prisma: PrismaService) {}

  async upload(file: Express.Multer.File | undefined, user: AuthenticatedUser) {
    if (!file?.buffer?.length) throw new BadRequestException('Choose a knowledge file to upload.');
    if (file.size > MAX_BYTES) throw new BadRequestException('Knowledge files must be 10 MB or smaller.');
    const extension = file.originalname.split('.').at(-1)?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.has(extension)) throw new BadRequestException('Upload PDF, DOCX, XLSX, CSV, or TXT files only.');

    const id = randomUUID();
    const fileName = file.originalname.replace(/[^\w.-]+/g, '_').slice(0, 160) || 'knowledge-file';
    const storageKey = `ai-knowledge/${id}/${fileName}`;
    try {
      await this.s3().send(new PutObjectCommand({
        Bucket: this.bucketName(),
        Key: storageKey,
        Body: file.buffer,
        ContentLength: file.size,
        ContentType: file.mimetype || 'application/octet-stream',
        ServerSideEncryption: 'AES256',
      }));
      const document = await this.prisma.aiKnowledgeDocument.create({
        data: {
          id,
          fileName,
          contentType: file.mimetype || 'application/octet-stream',
          storageKey,
          uploadedById: user.id,
          status: 'SCANNING',
        },
        select: { id: true, fileName: true, contentType: true, status: true, createdAt: true },
      });
      return document;
    } catch (error) {
      try {
        await this.s3().send(new DeleteObjectCommand({ Bucket: this.bucketName(), Key: storageKey }));
      } catch (cleanupError) {
        this.logger.error(`Could not clean up failed knowledge upload ${id}.`, cleanupError);
      }
      throw error;
    }
  }

  async list() {
    return this.prisma.aiKnowledgeDocument.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, fileName: true, contentType: true, status: true, uploadedById: true, createdAt: true, updatedAt: true },
      take: 200,
    });
  }

  async refreshScan(id: string) {
    const document = await this.prisma.aiKnowledgeDocument.findUnique({ where: { id } });
    if (!document) throw new NotFoundException('Knowledge document not found.');
    if (document.status !== 'SCANNING') return { id, status: document.status };

    const tags = await this.s3().send(new GetObjectTaggingCommand({ Bucket: this.bucketName(), Key: document.storageKey }));
    const scanKey = process.env.AWS_S3_SCAN_TAG_KEY?.trim() || 'GuardDutyMalwareScanStatus';
    const result = tags.TagSet?.find((tag) => tag.Key === scanKey)?.Value;
    if (!result) return { id, status: 'SCANNING' };
    if (result === 'THREATS_FOUND' || result === 'UNSUPPORTED') {
      await this.prisma.aiKnowledgeDocument.update({ where: { id }, data: { status: 'REJECTED' } });
      await this.s3().send(new DeleteObjectCommand({ Bucket: this.bucketName(), Key: document.storageKey }));
      return { id, status: 'REJECTED' };
    }
    if (result !== 'NO_THREATS_FOUND') return { id, status: 'SCANNING' };

    const object = await this.s3().send(new GetObjectCommand({ Bucket: this.bucketName(), Key: document.storageKey }));
    if (!object.Body) throw new ServiceUnavailableException('Scanned knowledge object could not be read.');
    const bytes = Buffer.from(await object.Body.transformToByteArray());
    if (bytes.byteLength > MAX_BYTES) throw new BadRequestException('The scanned knowledge file exceeds the indexing limit.');
    const extension = document.fileName.split('.').at(-1)?.toLowerCase() ?? '';
    let text: string;
    try {
      text = extension === 'txt' || extension === 'csv'
        ? bytes.toString('utf8')
        : (await OfficeParser.parseOffice(new Uint8Array(bytes), { fileType: extension as SupportedFileType })).toText();
    } catch (error) {
      this.logger.warn(`Could not extract text from clean knowledge file ${id}.`, error);
      await this.prisma.aiKnowledgeDocument.update({ where: { id }, data: { status: 'FAILED' } });
      await this.s3().send(new DeleteObjectCommand({ Bucket: this.bucketName(), Key: document.storageKey }));
      throw new BadRequestException('The clean file could not be read. Upload a valid, text-readable document.');
    }
    const indexedText = text.replace(/\u0000/g, '').trim().slice(0, MAX_TEXT_LENGTH);
    if (!indexedText) {
      await this.prisma.aiKnowledgeDocument.update({ where: { id }, data: { status: 'FAILED' } });
      await this.s3().send(new DeleteObjectCommand({ Bucket: this.bucketName(), Key: document.storageKey }));
      throw new BadRequestException('No readable text was found in this file.');
    }

    await this.prisma.aiKnowledgeDocument.update({
      where: { id },
      data: { status: 'INDEXED', indexedText },
    });
    await this.s3().send(new DeleteObjectCommand({ Bucket: this.bucketName(), Key: document.storageKey }));
    return { id, status: 'INDEXED' };
  }

  async delete(id: string) {
    const document = await this.prisma.aiKnowledgeDocument.findUnique({ where: { id } });
    if (!document) throw new NotFoundException('Knowledge document not found.');
    if (document.status === 'SCANNING') {
      await this.s3().send(new DeleteObjectCommand({ Bucket: this.bucketName(), Key: document.storageKey }));
    }
    await this.prisma.aiKnowledgeDocument.delete({ where: { id } });
    return { deleted: true };
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
