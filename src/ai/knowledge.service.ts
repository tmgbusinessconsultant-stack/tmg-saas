import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { OfficeParser, type SupportedFileType } from 'officeparser';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.service';

const MAX_BYTES = 10 * 1024 * 1024; // 10 Megabytes limit ceiling
const MAX_TEXT_LENGTH = 500_000;    // Maximum text length boundary for cognitive safety
const ALLOWED_EXTENSIONS = new Set(['pdf', 'docx', 'xlsx', 'csv', 'txt']);

@Injectable()
export class KnowledgeService implements OnModuleInit {
  private readonly logger = new Logger(KnowledgeService.name);
  private readonly storageDir: string;

  constructor(private readonly prisma: PrismaService) {
    const rawDir = process.env.LOCAL_STORAGE_DIR?.trim() || 'storage/cms';
    this.storageDir = path.resolve(process.cwd(), rawDir, 'knowledge-base');
  }

  /**
   * Initializes local storage target boundaries recursively on bootstrap
   */
  async onModuleInit() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      this.logger.log(`Local storage engine mounted successfully at: ${this.storageDir}`);
    } catch (err) {
      this.logger.error(`Storage driver allocation directory initialization failed: ${this.storageDir}`, err);
    }
  }

  /**
   * Safe Multi-Engine File Sourcing Writer
   */
  async upload(file: Express.Multer.File | undefined, user: AuthenticatedUser) {
    if (!file?.buffer?.length) throw new BadRequestException('Choose a knowledge file to upload.');
    if (file.size > MAX_BYTES) throw new BadRequestException('Knowledge files must be 10 MB or smaller.');

    const extension = file.originalname.split('.').at(-1)?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      throw new BadRequestException('Upload PDF, DOCX, XLSX, CSV, or TXT files only.');
    }

    const id = randomUUID();
    const fileName = file.originalname.replace(/[^\w.-]+/g, '_').slice(0, 160) || 'knowledge-file';

    const relativePath = path.join(id, fileName);
    const targetPath = path.join(this.storageDir, relativePath);

    try {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, file.buffer);

      return await this.prisma.aiKnowledgeDocument.create({
        data: {
          id,
          fileName,
          contentType: file.mimetype || 'application/octet-stream',
          storageKey: relativePath,
          uploadedById: user.id,
          status: 'AVAILABLE',
        },
        select: { id: true, fileName: true, contentType: true, status: true, createdAt: true },
      });
    } catch (error: any) {
      this.logger.error(`Write pipeline failure for file ${fileName}: ${error.message}`);
      await this.cleanupLocalFile(targetPath);
      throw new ServiceUnavailableException('Storage driver could not complete writing the file asset.');
    }
  }

  /**
   * Pulls inventory track records for administrative dashboard review
   */
  async list() {
    return this.prisma.aiKnowledgeDocument.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, fileName: true, contentType: true, status: true, uploadedById: true, createdAt: true, updatedAt: true },
      take: 200,
    });
  }

  /**
   * Local Parsing Processing Engine Core
   */
  async refreshScan(id: string) {
    const document = await this.prisma.aiKnowledgeDocument.findUnique({ where: { id } });
    if (!document) throw new NotFoundException('Knowledge document not found.');
    if (document.status === 'INDEXED') return { id, status: document.status };

    const targetPath = path.join(this.storageDir, document.storageKey);
    let bytes: Buffer;

    try {
      bytes = await fs.readFile(targetPath);
    } catch (err) {
      this.logger.error(`Target file read fault for key: ${document.storageKey}`);
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

    // Strip null characters out to prevent PostgreSQL text string field injection validation faults
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

  /**
   * Complete System Scouring Elimination Vector
   */
  async delete(id: string) {
    const document = await this.prisma.aiKnowledgeDocument.findUnique({ where: { id } });
    if (!document) throw new NotFoundException('Knowledge document not found.');

    const targetPath = path.join(this.storageDir, document.storageKey);
    await this.cleanupLocalFile(targetPath);

    await this.prisma.aiKnowledgeDocument.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * Internal Disk Resource Cleanup Driver
   */
  private async cleanupLocalFile(targetPath: string) {
    try {
      // Deletes target file reference
      await fs.unlink(targetPath).catch(() => { });
      // Sweeps empty tracking directory block cleanly
      await fs.rmdir(path.dirname(targetPath)).catch(() => { });
    } catch (err: any) {
      this.logger.error(`Disk cleanup intercept failed for path reference: ${targetPath}`, err);
    }
  }
}
