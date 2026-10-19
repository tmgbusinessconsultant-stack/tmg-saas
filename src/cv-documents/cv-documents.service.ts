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
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import PDFDocument = require('pdfkit');
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.service';

const MAX_CV_TEXT_LENGTH = 15000;
const MAX_AI_RESPONSE_TOKENS = 4500;

@Injectable()
export class CvDocumentsService {
  private readonly logger = new Logger(CvDocumentsService.name);
  private s3Client: S3Client | undefined;

  constructor(private readonly prisma: PrismaService) {}

  async generate(user: AuthenticatedUser, input: { name?: unknown; role?: unknown; experience?: unknown }) {
    const name = this.requiredText(input?.name, 'Full name', 120);
    const role = this.requiredText(input?.role, 'Target role', 160);
    const experience = this.requiredText(input?.experience, 'Experience, skills, and education', 12000);
    const content = await this.generateCv(name, role, experience);
    if (content.length > MAX_CV_TEXT_LENGTH) {
      throw new ServiceUnavailableException('The generated CV was too long. Please try again with shorter details.');
    }

    const id = randomUUID();
    const storageKey = `client-cvs/${user.id}/${id}.pdf`;
    const bucket = this.bucketName();
    const document = await this.prisma.cvDocument.create({
      data: {
        id,
        ownerId: user.id,
        title: `${name} - ${role} CV`,
        content,
        storageKey,
      },
      select: { id: true, title: true, content: true, createdAt: true },
    });

    try {
      const pdf = await this.renderPdf(name, content);
      await this.s3().send(new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        Body: pdf,
        ContentLength: pdf.byteLength,
        ContentType: 'application/pdf',
        ContentDisposition: `inline; filename="cv-${id}.pdf"`,
        ServerSideEncryption: 'AES256',
        Metadata: { ownerid: user.id, documentid: id },
      }));
    } catch (error) {
      try {
        await this.s3().send(new DeleteObjectCommand({ Bucket: bucket, Key: storageKey }));
      } catch (cleanupError) {
        this.logger.error(`Could not remove incomplete CV PDF ${id}.`, cleanupError);
      }
      try {
        await this.prisma.cvDocument.delete({ where: { id } });
      } catch (cleanupError) {
        this.logger.error(`Could not remove incomplete CV record ${id}.`, cleanupError);
      }
      throw error;
    }
    return {
      ...document,
      previewUrl: await this.signedUrl(bucket, storageKey, document.title, false),
      downloadUrl: await this.signedUrl(bucket, storageKey, document.title, true),
    };
  }

  async list(user: AuthenticatedUser) {
    const documents = await this.prisma.cvDocument.findMany({
      where: { ownerId: user.id },
      select: { id: true, title: true, createdAt: true, storageKey: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const bucket = this.bucketName();
    return Promise.all(documents.map(async (document) => ({
      id: document.id,
      title: document.title,
      createdAt: document.createdAt,
      previewUrl: await this.signedUrl(bucket, document.storageKey, document.title, false),
      downloadUrl: await this.signedUrl(bucket, document.storageKey, document.title, true),
    })));
  }

  async get(user: AuthenticatedUser, id: string) {
    const document = await this.prisma.cvDocument.findFirst({
      where: { id, ownerId: user.id },
      select: { id: true, title: true, content: true, storageKey: true, createdAt: true },
    });
    if (!document) throw new NotFoundException('CV not found.');
    const bucket = this.bucketName();
    return {
      id: document.id,
      title: document.title,
      content: document.content,
      createdAt: document.createdAt,
      previewUrl: await this.signedUrl(bucket, document.storageKey, document.title, false),
      downloadUrl: await this.signedUrl(bucket, document.storageKey, document.title, true),
    };
  }

  private async generateCv(name: string, role: string, experience: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) throw new ServiceUnavailableException('The CV generation service is not configured.');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.4,
        max_tokens: MAX_AI_RESPONSE_TOKENS,
        messages: [
          {
            role: 'system',
            content: 'Create a truthful, ATS-friendly CV as plain text. Do not invent qualifications, employers, dates, metrics, or contact details. Use a professional name heading followed by Professional Summary, Core Skills, Professional Experience, Education, and Certifications where supported by supplied facts. Mark missing information with [Add details]. Keep formatting simple and avoid markdown tables.',
          },
          {
            role: 'user',
            content: `Name: ${name}\nTarget role: ${role}\nExperience, skills, and education supplied by the user:\n${experience}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(45000),
    });
    const result: unknown = await response.json();
    if (!response.ok) {
      this.logger.error(`CV provider returned HTTP ${response.status}.`);
      throw new ServiceUnavailableException('The CV generation service could not complete the request.');
    }
    if (typeof result !== 'object' || result === null || !('choices' in result) || !Array.isArray(result.choices)) {
      throw new ServiceUnavailableException('The CV generation service returned an invalid response.');
    }
    const firstChoice: unknown = result.choices[0];
    if (
      typeof firstChoice !== 'object' || firstChoice === null ||
      !('message' in firstChoice) || typeof firstChoice.message !== 'object' || firstChoice.message === null ||
      !('content' in firstChoice.message) || typeof firstChoice.message.content !== 'string'
    ) {
      throw new ServiceUnavailableException('The CV generation service returned an empty response.');
    }
    const content = firstChoice.message.content.trim();
    if (!content || content.length > MAX_CV_TEXT_LENGTH) {
      throw new ServiceUnavailableException('The generated CV was empty or too long. Please try again.');
    }
    return content;
  }

  private renderPdf(name: string, content: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const document = new PDFDocument({ size: 'A4', margins: { top: 52, bottom: 52, left: 58, right: 58 }, bufferPages: true });
      const chunks: Buffer[] = [];
      document.on('data', (chunk: Buffer) => chunks.push(chunk));
      document.on('error', reject);
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.font('Helvetica-Bold').fontSize(18).fillColor('#0F172A').text(name, { align: 'center' });
      document.moveDown(0.8);
      document.font('Helvetica').fontSize(10.5).fillColor('#1F2937').text(content, {
        align: 'left',
        lineGap: 3,
        paragraphGap: 6,
      });
      const range = document.bufferedPageRange();
      for (let page = range.start; page < range.start + range.count; page += 1) {
        document.switchToPage(page);
        document.font('Helvetica').fontSize(8).fillColor('#64748B')
          .text(`Page ${page + 1} of ${range.count}`, 58, 785, { align: 'center', lineBreak: false });
      }
      document.end();
    });
  }

  private async signedUrl(bucket: string, storageKey: string, title: string, download: boolean): Promise<string> {
    const filename = `${title.replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').slice(0, 100)}.pdf`;
    return getSignedUrl(this.s3(), new GetObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      ResponseContentType: 'application/pdf',
      ResponseContentDisposition: `${download ? 'attachment' : 'inline'}; filename="${filename}"`,
    }), { expiresIn: 300 });
  }

  private requiredText(value: unknown, label: string, maximum: number): string {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum) {
      throw new BadRequestException(`${label} is required and must be ${maximum} characters or fewer.`);
    }
    return value.trim();
  }

  private bucketName(): string {
    const bucket = process.env.AWS_S3_BUCKET?.trim();
    if (!bucket) throw new ServiceUnavailableException('AWS_S3_BUCKET is not configured.');
    return bucket;
  }

  private s3(): S3Client {
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
