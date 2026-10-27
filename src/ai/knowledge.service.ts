import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { OfficeParser, type SupportedFileType } from 'officeparser';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.service';

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_LENGTH = 500_000;
const ALLOWED_EXTENSIONS = new Set(['pdf', 'docx', 'xlsx', 'csv', 'txt']);

@Injectable()
export class KnowledgeService implements OnModuleInit  {
  private readonly logger = new Logger(KnowledgeService.name);
  private storageDir: string;

  constructor(private readonly prisma: PrismaService) {
    // Falls back gracefully to standard local dir variable structures if unset
    const rawDir = process.env.LOCAL_STORAGE_DIR?.trim() || 'storage/cms';
    this.storageDir = path.resolve(process.cwd(), rawDir, 'knowledge-base');
  }

  async onModuleInit() {
    try {
      // Guarantees write targets exist recursively on environment launch boot
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (err) {
      this.logger.error(`Storage driver allocation directory initialization failed: ${this.storageDir}`, err);
    }
  }

  async upload(file: Express.Multer.File | undefined, user: AuthenticatedUser) {
    if (!file?.buffer?.length) throw new BadRequestException('Choose a knowledge file to upload.');
    if (file.size > MAX_BYTES) throw new BadRequestException('Knowledge files must be 10 MB or smaller.');

    const extension = file.originalname.split('.').at(-1)?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.has(extension)) throw new BadRequestException('Upload PDF, DOCX, XLSX, CSV, or TXT files only.');

    const id = randomUUID();
    const fileName = file.originalname.replace(/[^\w.-]+/g, '_').slice(0, 160) || 'knowledge-file';

    // Configures discrete local storage paths instead of remote S3 keys
    const relativePath = path.join(id, fileName);
    const targetPath = path.join(this.storageDir, relativePath);

    try {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, file.buffer);

      const document = await this.prisma.aiKnowledgeDocument.create({
        data: {
          id,
          fileName,
          contentType: file.mimetype || 'application/octet-stream',
          storageKey: relativePath, // Stores path offset context parameter safely
          uploadedById: user.id,
          status: 'AVAILABLE', // Defaults immediately to active local access state
        },
        select: { id: true, fileName: true, contentType: true, status: true, createdAt: true },
      });

      return document;
    } catch (error) {
      try {
        await fs.unlink(targetPath).catch(() => { });
        await fs.rmdir(path.dirname(targetPath)).catch(() => { });
      } catch (cleanupError) {
        this.logger.error(`Could not clean up failed knowledge upload ${id}.`, cleanupError);
      }
      throw new ServiceUnavailableException('Storage driver could not complete writing the file asset.');
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

    // Local filesystem driver bypasses external threat scanning queues completely
    if (document.status === 'INDEXED') return { id, status: document.status };

    const targetPath = path.join(this.storageDir, document.storageKey);
    let bytes: Buffer;

    try {
      bytes = await fs.readFile(targetPath);
    } catch (err) {
      throw new ServiceUnavailableException('Target local file storage reference could not be read.');
    }

    if (bytes.byteLength > MAX_BYTES) throw new BadRequestException('The targeted knowledge file exceeds indexing limits.');
    const extension = document.fileName.split('.').at(-1)?.toLowerCase() ?? '';
    let text: string;

    try {
      text = extension === 'txt' || extension === 'csv'
        ? bytes.toString('utf8')
        : String(await OfficeParser.parseOffice(new Uint8Array(bytes), { fileType: extension as SupportedFileType }));
    } catch (error) {
      this.logger.warn(`Could not extract raw text mapping from localized document reference: ${id}.`, error);
      await this.prisma.aiKnowledgeDocument.update({ where: { id }, data: { status: 'FAILED' } });
      await this.cleanupLocalFile(targetPath);
      throw new BadRequestException('The file could not be parsed. Ensure you upload a text-readable document.');
    }

    const indexedText = text.replace(/\u0000/g, '').trim().slice(0, MAX_TEXT_LENGTH);
    if (!indexedText) {
      await this.prisma.aiKnowledgeDocument.update({ where: { id }, data: { status: 'FAILED' } });
      await this.cleanupLocalFile(targetPath);
      throw new BadRequestException('No readable structured characters located in this file asset.');
    }

    await this.prisma.aiKnowledgeDocument.update({
      where: { id },
      data: { status: 'INDEXED', indexedText },
    });

    await this.cleanupLocalFile(targetPath);
    return { id, status: 'INDEXED' };
  }

  async delete(id: string) {
    const document = await this.prisma.aiKnowledgeDocument.findUnique({ where: { id } });
    if (!document) throw new NotFoundException('Knowledge document not found.');

    const targetPath = path.join(this.storageDir, document.storageKey);
    await this.cleanupLocalFile(targetPath);

    await this.prisma.aiKnowledgeDocument.delete({ where: { id } });
    return { deleted: true };
  }

  private async cleanupLocalFile(targetPath: string) {
    try {
      await fs.unlink(targetPath).catch(() => { });
      await fs.rmdir(path.dirname(targetPath)).catch(() => { });
    } catch (err) {
      this.logger.error(`Disk cleanup intercept failed for path reference: ${targetPath}`, err);
    }
  }
}



