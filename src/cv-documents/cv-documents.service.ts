import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument = require('pdfkit');
import type { AuthenticatedUser } from '../auth/auth.service';

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

  async generate(user: AuthenticatedUser, dto: any) {
    const userId = user.id || (user as any).sub;
    const template = dto.template || dto.documentType || 'Qatar Professional';
    const country = dto.country || dto.targetCountry || 'Qatar';
    const rawForCurrency = JSON.stringify(dto) + ' ' + template + ' ' + country + ' ' + (dto.expectedSalary || '') + ' ' + (dto.salary || '');
    const currencyInfo = this.detectCurrency(rawForCurrency, country);

    // NO FILE SAVE — just save JSON to DB. PDF is generated on demand.
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
      } as any,
    });
    return { id: doc.id, title: doc.title, content: doc.content, createdAt: doc.createdAt, currency: currencyInfo.currency, symbol: currencyInfo.symbol, country: currencyInfo.country };
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
  async findOne(id: string) {
    const doc = await this.prisma.cvDocument.findFirst({ where: { id } as any });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  // NEW: Generate PDF on the fly from DB content
  async getFileBuffer(id: string, user: AuthenticatedUser) {
    const docRecord = await this.get(user, id);
    let dto: any;
    try { dto = JSON.parse(docRecord.content); } catch { dto = { summary: docRecord.content }; }
    const template = dto.template || 'Qatar Professional';
    const curr = dto.currencyInfo || this.detectCurrency(JSON.stringify(dto), dto.country);
    const docType = (dto.documentType || dto.type || template || '').toLowerCase();
    const isCoverLetter = docType.includes('cover') || template.toLowerCase().includes('cover');
    const isContract = docType.includes('contract');
    const isProposal = docType.includes('proposal');
    const isPolicy = docType.includes('policy');
    const isSop = docType.includes('sop');
    const isJudgement = docType.includes('judgement') || docType.includes('judgment') || docType.includes('review');

    let buffer: Buffer;
    if (isCoverLetter) buffer = await this.createCoverLetterPdf(dto, template, curr);
    else if (isContract) buffer = await this.createContractPdf(dto, template, curr);
    else if (isProposal) buffer = await this.createProposalPdf(dto, template, curr);
    else if (isPolicy) buffer = await this.createPolicyPdf(dto, template, curr);
    else if (isSop) buffer = await this.createSopPdf(dto, template, curr);
    else if (isJudgement) buffer = await this.createJudgementReviewPdf(dto, template, curr);
    else buffer = await this.createProfessionalPdf(dto, template, curr);

    return { buffer, doc: docRecord };
  }

  async remove(user: AuthenticatedUser, id: string) {
    const doc = await this.get(user, id);
    await this.prisma.cvDocument.delete({ where: { id } as any });
    return { deleted: true };
  }
  async setDownloadControl(id: string, body: any) {
    return this.prisma.cvDocument.update({ where: { id } as any, data: { downloadMode: body.downloadMode || 'FREE', price: body.price || 0 } as any });
  }
  async grantFreeAccess(id: string, userId: string) {
    return { id, grantedTo: userId, access: 'free' };
  }

  private createCoverLetterPdf(dto: any, template: string, curr: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
      const chunks: Buffer[] = []; doc.on('data', (c) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks as any)));
      const name = dto.applicantName || dto.name || dto.contact?.fullName || 'Applicant Name';
      const role = dto.position || dto.role || dto.contact?.title || 'Target Role';
      const company = dto.companyName || dto.company || 'Hiring Company';
      const salary = dto.expectedSalary || dto.salary || '';
      const salaryText = salary ? `Expected Salary: ${curr.symbol}${salary} ${curr.currency}` : `Salary: Competitive in ${curr.currency}`;
      doc.rect(0, 0, 595, 85).fill('#0F172A');
      doc.fillColor('#D4AF37').fontSize(9).font('Helvetica-Bold').text(`COVER LETTER | ${curr.country.toUpperCase()} |${curr.currency} | ${curr.compliance}`, 50, 15);
      doc.fillColor('white').fontSize(18).font('Helvetica-Bold').text(name.toUpperCase(), 50, 32);
      doc.fontSize(11).fillColor('#E5E7EB').text(`${role} | ${company} | ${salaryText}`, 50, 58);
      let y = 110;
      doc.fillColor('#111827').fontSize(10).font('Helvetica').text(`Date: ${new Date().toLocaleDateString()}`, 50, y); y += 15;
      doc.text(`To: Hiring Manager, ${company}`, 50, y); y += 15;
      doc.text(`Re: Application for ${role} - ${curr.country} Market`, 50, y); y += 25;
      doc.font('Helvetica-Bold').fontSize(11).text('Dear Hiring Manager,', 50, y); y += 18;
      doc.font('Helvetica').fontSize(10);
      const paragraphs = [
        dto.coverLetterBody || dto.body || `I am writing to express my strong interest in the ${role} position at ${company} within the ${curr.country} market.`,
        dto.paragraph2 || `My expertise aligns with ${curr.country} requirements: ${curr.law} and ${curr.compliance}.`,
        dto.paragraph3 || `Opportunity to work in ${curr.country} with compensation in ${curr.currency} (${curr.symbol}) and tax ${curr.tax} is appealing.`,
        dto.closing || `Sincerely,\n${name}`
      ];
      paragraphs.forEach(p => { doc.text(p, 50, y, { width: 495, lineGap: 3 }); y = doc.y + 12; if (y > 700) { doc.addPage(); y = 50; } });
      doc.end();
    });
  }
  private createJudgementReviewPdf(dto: any, template: string, curr: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
      const chunks: Buffer[] = []; doc.on('data', (c) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks as any)));
      doc.rect(0, 0, 595, 85).fill('#1E293B');
      doc.fillColor('#D4AF37').fontSize(9).font('Helvetica-Bold').text(`JUDGEMENT REVIEW | ${curr.country.toUpperCase()} | ${curr.currency} | ${curr.law}`, 50, 15);
      doc.fillColor('white').fontSize(16).font('Helvetica-Bold').text(`LEGAL DOCUMENT REVIEW - ${curr.country}`, 50, 32);
      let y = 110; doc.fillColor('#111827').fontSize(10).text(dto.summary || 'Review summary', 50, y, { width: 495 }); doc.end();
    });
  }
  private createProfessionalPdf(dto: any, template: string, curr: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
      const chunks: Buffer[] = []; doc.on('data', (c) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks as any)));
      const data = dto.contact ? dto : { contact: { fullName: dto.name, title: dto.role, email: dto.email, phone: dto.phone, location: dto.location || curr.country }, summary: dto.summary, exps: dto.exps || [], edus: dto.edus || [], skills: dto.skills, langs: dto.langs, certs: dto.certs };
      const contact = data.contact || {};
      const fullName = (contact.fullName || dto.name || 'Your Name').toUpperCase();
      const title = contact.title || dto.role || '';
      const TPL: any = { 'Qatar Professional': { header: '#0F172A', accent: '#D4AF37', textHeader: '#D4AF37' }, 'Corporate Executive': { header: '#1E3A8A', accent: '#3B82F6', textHeader: 'white' }, 'ATS Minimal': { header: '#FFFFFF', accent: '#111827', textHeader: 'black' } };
      const cfg = TPL[template] || TPL['Qatar Professional'];
      if (template !== 'ATS Minimal') {
        doc.rect(0, 0, 595, 105).fill(cfg.header);
        doc.fillColor('#D4AF37').fontSize(7).font('Helvetica-Bold').text(`${curr.country.toUpperCase()} | ${curr.currency} (${curr.symbol}) | ${curr.compliance} | ${curr.law}`, 40, 8);
        doc.fillColor(cfg.textHeader).fontSize(22).font('Helvetica-Bold').text(fullName, 40, 22, { width: 515 });
        doc.fillColor('#E5E7EB').fontSize(11).font('Helvetica').text(`${title} | ${curr.country} | Expected: ${curr.symbol} ${dto.expectedSalary || 'Competitive'} ${curr.currency}`, 40, 50);
        doc.fontSize(9).text(`${contact.email || ''} ${contact.phone ? '| ' + contact.phone : ''} | ${curr.country}`, 40, 68, { width: 515 });
        doc.y = 125;
      } else {
        doc.fillColor('black').fontSize(24).font('Helvetica-Bold').text(fullName, 40, 35); doc.y = 120;
      }
      const left = 40; const width = 515;
      const section = (t: string) => { doc.fillColor(cfg.accent).fontSize(11).font('Helvetica-Bold').text(t.toUpperCase(), left); doc.moveDown(0.5); doc.fillColor('#111827').font('Helvetica').fontSize(10); };
      if (data.summary) { section('Professional Summary - ' + curr.country); doc.text(data.summary, left, doc.y, { width, lineGap: 2 }); }
      const exps = data.exps?.filter((e: any) => e.title || e.bullets) || [];
      if (exps.length) { section('Professional Experience'); exps.forEach((e: any) => { doc.font('Helvetica-Bold').fontSize(10).text(`${e.title}${e.company ? ` at ${e.company}` : ''}`, left, doc.y, { width }); doc.font('Helvetica').fontSize(10).text(e.bullets || '', left, doc.y, { width, lineGap: 2 }); doc.moveDown(0.6); }); }
      if (data.skills) { section('Core Skills'); doc.text(data.skills, left, doc.y, { width }); }
      doc.end();
    });
  }
  private createPolicyPdf(dto: any, template: string, curr: any): Promise<Buffer> { return this.createProfessionalPdf(dto, template, curr); }
  private createSopPdf(dto: any, template: string, curr: any): Promise<Buffer> { return this.createProfessionalPdf(dto, template, curr); }
  private createContractPdf(dto: any, template: string, curr: any): Promise<Buffer> { return this.createProfessionalPdf(dto, template, curr); }
  private createProposalPdf(dto: any, template: string, curr: any): Promise<Buffer> { return this.createProfessionalPdf(dto, template, curr); }
}