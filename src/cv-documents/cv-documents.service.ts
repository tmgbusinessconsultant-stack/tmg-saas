import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument = require('pdfkit');

@Injectable()
export class CvDocumentsService {
  constructor(private prisma: PrismaService) { }

  private detectCurrency(raw: string, country?: string) {
    const upper = (raw + ' ' + (country || '')).toUpperCase();
    if (upper.includes('AUD') || upper.includes('A$') || upper.includes('AUSTRALIA')) return { currency: 'AUD', symbol: 'A$', country: 'Australia', law: 'Fair Work Act 2009, ASIC', tax: 'GST 10%', compliance: 'ABN/ACN Required, ATS 95%+' };
    if (upper.includes('QAR') || upper.includes('QATAR')) return { currency: 'QAR', symbol: 'QAR ', country: 'Qatar', law: 'Qatar Labour Law No.14/2004, QFC Regulations', tax: 'No Income Tax', compliance: 'QFC LLC, Ministry Approved' };
    if (upper.includes('AED') || upper.includes('UAE') || upper.includes('DUBAI')) return { currency: 'AED', symbol: 'AED ', country: 'UAE', law: 'UAE Labour Law Federal Decree No.33/2021', tax: '5% VAT', compliance: 'MOHRE Approved' };
    if (upper.includes('SAR') || upper.includes('SAUDI')) return { currency: 'SAR', symbol: 'SAR ', country: 'Saudi Arabia', law: 'Saudi Labour Law, MHRSD', tax: '15% VAT', compliance: 'Qiwa/Mudad Approved' };
    if (upper.includes('GBP') || upper.includes('£') || upper.includes('UK') || upper.includes('BRITISH')) return { currency: 'GBP', symbol: '£', country: 'United Kingdom', law: 'Employment Rights Act 1996, Equality Act 2010', tax: 'PAYE', compliance: 'UKVI, Right to Work' };
    if (upper.includes('EUR') || upper.includes('€') || upper.includes('GERMANY') || upper.includes('EUROPE')) return { currency: 'EUR', symbol: '€', country: 'EU', law: 'EU Labour Directive, GDPR', tax: 'Varies 19-25%', compliance: 'EU Blue Card' };
    if (upper.includes('CAD') || upper.includes('CANADA')) return { currency: 'CAD', symbol: 'C$', country: 'Canada', law: 'Canada Labour Code, Human Rights Act', tax: 'GST/HST', compliance: 'LMIA, Express Entry' };
    if (upper.includes('INR') || upper.includes('INDIA') || upper.includes('₹')) return { currency: 'INR', symbol: '₹', country: 'India', law: 'Shops & Establishments, ID Act', tax: 'GST 18%', compliance: 'PF/ESI' };
    if (upper.includes('SGD') || upper.includes('SINGAPORE')) return { currency: 'SGD', symbol: 'S$', country: 'Singapore', law: 'Employment Act, MOM', tax: '7% GST', compliance: 'MOM Approved' };
    return { currency: 'USD', symbol: '$', country: 'USA', law: 'FLSA, Title VII, EEOC', tax: 'Federal/State', compliance: 'ATS 95%+, USCIS' };
  }

  async generate(user: any, dto: any) {
    const userId = user.userId || user.id || user.sub;
    const template = dto.template || dto.documentType || 'Qatar Professional';
    const country = dto.country || dto.targetCountry || 'Qatar';
    const rawForCurrency = JSON.stringify(dto) + ' ' + template + ' ' + country + ' ' + (dto.expectedSalary || '') + ' ' + (dto.salary || '');
    const currencyInfo = this.detectCurrency(rawForCurrency, country);

    const fileName = `generated-${Date.now()}.pdf`;
    const titlePrefix = template.toLowerCase().includes('cover') ? 'Cover Letter' : 'CV';

    const doc = await this.prisma.cvDocument.create({
      data: {
        ownerId: userId,
        title: `${dto.name || dto.contact?.fullName || dto.applicantName || 'Applicant'} - ${dto.role || dto.contact?.title || ''} ${titlePrefix} [${template}] [${currencyInfo.country}]`,
        content: JSON.stringify({ ...dto, currencyInfo, template }),
        storageKey: fileName,
        downloadMode: 'FREE',
        price: 0,
        currency: currencyInfo.currency,
      },
    });
    return { id: doc.id, title: doc.title, content: doc.content, createdAt: doc.createdAt, currency: currencyInfo.currency, symbol: currencyInfo.symbol, country: currencyInfo.country };
  }

  async list(user: any) {
    const userId = user.userId || user.id || user.sub;
    return this.prisma.cvDocument.findMany({ where: { ownerId: userId }, orderBy: { createdAt: 'desc' } });
  }

  async listAll() {
    return this.prisma.cvDocument.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async get(user: any, id: string) {
    const userId = user.userId || user.id || user.sub;
    const doc = await this.prisma.cvDocument.findFirst({ where: { id, ownerId: userId } });
    if (!doc) throw new NotFoundException('Document reference profile not located.');
    return doc;
  }

  async getFileBuffer(id: string, user: any) {
    const docRecord = await this.get(user, id);
    let dto: any;
    try { dto = JSON.parse(docRecord.content); } catch { dto = { summary: docRecord.content }; }
    const template = dto.template || 'Qatar Professional';
    const curr = dto.currencyInfo || this.detectCurrency(JSON.stringify(dto), dto.country);

    let buffer: Buffer;
    if (template.toLowerCase().includes('cover')) {
      buffer = await this.createCoverLetterPdf(dto, template, curr);
    } else {
      buffer = await this.createProfessionalPdf(dto, template, curr);
    }
    return { buffer, doc: docRecord };
  }

  async remove(user: any, id: string) {
    await this.get(user, id);
    await this.prisma.cvDocument.delete({ where: { id } });
    return { deleted: true };
  }

  async setDownloadControl(id: string, body: any) {
    return this.prisma.cvDocument.update({ where: { id }, data: { downloadMode: body.downloadMode || 'FREE', price: body.price || 0 } });
  }

  async grantFreeAccess(id: string, userId: string) {
    return { id, grantedTo: userId, access: 'free' };
  }

  private createCoverLetterPdf(dto: any, template: string, curr: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
      const chunks: Buffer[] = []; doc.on('data', (c) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks)));

      const name = dto.applicantName || dto.name || dto.contact?.fullName || 'Applicant Name';
      const role = dto.position || dto.role || dto.contact?.title || 'Target Role';
      const company = dto.companyName || dto.company || 'Hiring Company';

      doc.rect(0, 0, 595, 85).fill('#0F172A');
      doc.fillColor('#D4AF37').fontSize(9).font('Helvetica-Bold').text(`COVER LETTER | ${curr.country.toUpperCase()} | COMPLIANCE: ${curr.compliance}`, 50, 15);
      doc.fillColor('white').fontSize(18).font('Helvetica-Bold').text(name.toUpperCase(), 50, 32);

      let y = 120;
      doc.fillColor('#374151').fontSize(10).font('Helvetica-Bold').text(`Date: ${new Date().toLocaleDateString()}`, 50, y);
      y += 35;
      doc.font('Helvetica-Bold').text(`Subject: Expression of Interest for ${role} Role`, 50, y);
      y += 25;

      const letterContent = dto.summary || 'Please accept this application outlining my background for review.';
      doc.font('Helvetica').fontSize(10.5).text(letterContent, 50, y, { width: 495, align: 'justify', lineGap: 4 });

      doc.end();
    });
  }

  private createProfessionalPdf(dto: any, template: string, curr: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
      const chunks: Buffer[] = []; doc.on('data', (c) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks)));

      const name = dto.name || dto.contact?.fullName || 'EXECUTIVE NAME';
      const role = dto.role || dto.contact?.title || 'EXECUTIVE TITLE';

      doc.rect(0, 0, 595, 95).fill('#1E293B');
      doc.fillColor('#F59E0B').fontSize(8).font('Helvetica-Bold').text(`COMPLIANCE STRATEGY: ${curr.law}`, 40, 18);
      doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text(name.toUpperCase(), 40, 32);
      doc.fillColor('#94A3B8').fontSize(12).text(role, 40, 60);

      let y = 120;
      if (dto.summary) {
        doc.fillColor('#1E293B').fontSize(11).font('Helvetica-Bold').text('EXECUTIVE PRESENTATION', 40, y);
        y += 18;
        doc.fillColor('#334155').fontSize(10).font('Helvetica').text(dto.summary, 40, y, { width: 515, align: 'justify' });
        y = (doc as any).y + 20;
      }

      if (dto.exps && Array.isArray(dto.exps)) {
        doc.fillColor('#1E293B').fontSize(11).font('Helvetica-Bold').text('PROFESSIONAL MILESTONES', 40, y);
        y += 18;
        for (const ex of dto.exps) {
          doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text(`${ex.title} — ${ex.company}`, 40, y);
          y += 14;
          if (ex.bullets) {
            doc.fillColor('#475569').text(ex.bullets, 50, y, { width: 505 });
            y = (doc as any).y + 10;
          }
        }
      }

      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(7).fillColor('#94A3B8').text(`Jurisdiction Framework: ${curr.country} • ${curr.law} • Page ${i + 1} of ${pageCount}`, 40, 815, { align: 'center' });
      }
      doc.end();
    });
  }
}
