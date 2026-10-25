import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import PDFDocument = require('pdfkit');
import type { AuthenticatedUser } from '../auth/auth.service';

@Injectable()
export class CvDocumentsService {
  constructor(private prisma: PrismaService) { }

  private s3() {
    return new S3Client({
      region: process.env.AWS_REGION || process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT || process.env.AWS_S3_ENDPOINT,
      credentials: process.env.AWS_ACCESS_KEY_ID ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      } : undefined,
      forcePathStyle: true,
    });
  }
  private bucket() { return process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || ''; }

  private detectCurrency(raw: string, country?: string) {
    const upper = (raw + ' ' + (country || '')).toUpperCase();
    if (upper.includes('AUD') || upper.includes('AUSTRALIA')) return { currency: 'AUD', symbol: 'A$', country: 'Australia', law: 'Fair Work Act 2009, ASIC', tax: 'GST 10%', compliance: 'ABN/ACN Required, ATS 95%+' };
    if (upper.includes('QAR') || upper.includes('QATAR')) return { currency: 'QAR', symbol: 'QAR ', country: 'Qatar', law: 'Qatar Labour Law No.14/2004, QFC Regulations', tax: 'No Income Tax', compliance: 'QFC LLC, Ministry Approved' };
    if (upper.includes('AED') || upper.includes('UAE') || upper.includes('DUBAI')) return { currency: 'AED', symbol: 'AED ', country: 'UAE', law: 'UAE Labour Law Federal Decree No.33/2021', tax: '5% VAT', compliance: 'MOHRE Approved' };
    if (upper.includes('SAR') || upper.includes('SAUDI')) return { currency: 'SAR', symbol: 'SAR ', country: 'Saudi Arabia', law: 'Saudi Labour Law, MHRSD', tax: '15% VAT', compliance: 'Qiwa/Mudad Approved' };
    if (upper.includes('GBP') || upper.includes('£') || upper.includes('UK')) return { currency: 'GBP', symbol: '£', country: 'United Kingdom', law: 'Employment Rights Act 1996', tax: 'PAYE', compliance: 'UKVI, Right to Work' };
    return { currency: 'USD', symbol: '$', country: 'USA', law: 'FLSA, Title VII, EEOC', tax: 'Federal/State', compliance: 'ATS 95%+, USCIS' };
  }

  async generate(user: AuthenticatedUser, dto: any) {
    const userId = user.id || (user as any).sub;
    const template = dto.template || dto.documentType || 'Qatar Professional';
    const docType = (dto.documentType || dto.type || template || '').toLowerCase();
    const isCoverLetter = docType.includes('cover');
    const isContract = docType.includes('contract');
    const isProposal = docType.includes('proposal');
    const isPolicy = docType.includes('policy');
    const isSop = docType.includes('sop');
    const isJudgement = docType.includes('judgement') || docType.includes('judgment') || docType.includes('review');
    const country = dto.country || dto.targetCountry || 'Qatar';
    const currencyInfo = this.detectCurrency(JSON.stringify(dto) + ' ' + template + ' ' + country, country);
    let pdfBuffer: Buffer;
    if (isCoverLetter) pdfBuffer = await this.createCoverLetterPdf(dto, template, currencyInfo);
    else if (isContract) pdfBuffer = await this.createContractPdf(dto, template, currencyInfo);
    else if (isProposal) pdfBuffer = await this.createProposalPdf(dto, template, currencyInfo);
    else if (isPolicy) pdfBuffer = await this.createPolicyPdf(dto, template, currencyInfo);
    else if (isSop) pdfBuffer = await this.createSopPdf(dto, template, currencyInfo);
    else if (isJudgement) pdfBuffer = await this.createJudgementReviewPdf(dto, template, currencyInfo);
    else pdfBuffer = await this.createProfessionalPdf(dto, template, currencyInfo);
    const fileName = `cvs/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`;
    await this.s3().send(new PutObjectCommand({ Bucket: this.bucket(), Key: fileName, Body: pdfBuffer, ContentType: 'application/pdf' }));
    const doc = await this.prisma.cvDocument.create({
      data: {
        ownerId: userId,
        title: `${dto.name || dto.contact?.fullName || 'Applicant'} - ${dto.role || ''} CV [${template}]`,
        content: JSON.stringify({ ...dto, currencyInfo }),
        storageKey: fileName,
        downloadMode: 'FREE',
        price: 0,
        currency: currencyInfo.currency,
      } as any,
    });
    return { id: doc.id, title: doc.title, createdAt: doc.createdAt };
  }
  create = this.generate;

  async list(user: AuthenticatedUser) {
    const userId = user.id || (user as any).sub;
    return this.prisma.cvDocument.findMany({ where: { ownerId: userId } as any, orderBy: { createdAt: 'desc' } });
  }
  async listAll() { return this.prisma.cvDocument.findMany({ orderBy: { createdAt: 'desc' } }); }
  async get(user: AuthenticatedUser, id: string) {
    const userId = user.id || (user as any).sub;
    const doc = await this.prisma.cvDocument.findFirst({ where: { id, ownerId: userId } as any });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }
  async getFilePath(id: string, user: AuthenticatedUser, wantDownload: boolean) {
    const docRecord = await this.get(user, id);
    const url = await getSignedUrl(this.s3(), new GetObjectCommand({ Bucket: this.bucket(), Key: docRecord.storageKey, ResponseContentDisposition: `${wantDownload ? 'attachment' : 'inline'}; filename="${docRecord.title}.pdf"` }), { expiresIn: 3600 });
    return { fileUrl: url, doc: docRecord } as any;
  }
  async remove(user: AuthenticatedUser, id: string) {
    const doc = await this.get(user, id);
    try { await this.s3().send(new DeleteObjectCommand({ Bucket: this.bucket(), Key: doc.storageKey })); } catch { }
    await this.prisma.cvDocument.delete({ where: { id } as any });
    return { deleted: true };
  }
  async setDownloadControl(id: string, body: any) {
    return this.prisma.cvDocument.update({ where: { id } as any, data: { downloadMode: body.downloadMode || 'FREE', price: body.price || 0 } as any });
  }
  async grantFreeAccess(id: string, userId: string) {
    const doc = await this.prisma.cvDocument.findFirst({ where: { id } as any });
    if (!doc) throw new NotFoundException('Document not found');
    return { id, grantedTo: userId, access: 'free' };
  }

  private createCoverLetterPdf(dto: any, template: string, curr: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
      const chunks: Buffer[] = []; doc.on('data', (c) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks as any)));
      doc.text(`Cover Letter - ${dto.name || 'Applicant'} - ${curr.country}`); doc.end();
    });
  }
  private createJudgementReviewPdf(dto: any, template: string, curr: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
      const chunks: Buffer[] = []; doc.on('data', (c) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks as any)));
      doc.text(`Review - ${curr.country}`); doc.end();
    });
  }
  private createProfessionalPdf(dto: any, template: string, curr: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
      const chunks: Buffer[] = []; doc.on('data', (c) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks as any)));
      doc.rect(0, 0, 595, 105).fill('#0F172A'); doc.fillColor('white').fontSize(18).text((dto.name || 'Applicant').toUpperCase(), 40, 30); doc.fillColor('black').fontSize(10).text(dto.summary || 'CV Content', 40, 120, { width: 515 }); doc.end();
    });
  }
  private createPolicyPdf(dto: any, template: string, curr: any): Promise<Buffer> { return this.createProfessionalPdf(dto, template, curr); }
  private createSopPdf(dto: any, template: string, curr: any): Promise<Buffer> { return this.createProfessionalPdf(dto, template, curr); }
  private createContractPdf(dto: any, template: string, curr: any): Promise<Buffer> { return this.createProfessionalPdf(dto, template, curr); }
  private createProposalPdf(dto: any, template: string, curr: any): Promise<Buffer> { return this.createProfessionalPdf(dto, template, curr); }
}