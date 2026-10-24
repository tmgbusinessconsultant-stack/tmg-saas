import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument = require('pdfkit');
import * as fs from 'fs';
import * as path from 'path';
import type { AuthenticatedUser } from '../auth/auth.service';

@Injectable()
export class CvDocumentsService {
  constructor(private prisma: PrismaService) {}

  private getUploadsDir() {
    const dir = path.join(process.cwd(), 'uploads', 'cvs');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  private detectCurrency(raw: string, country?: string) {
    const upper = (raw + ' ' + (country||'')).toUpperCase();
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
    const docType = (dto.documentType || dto.type || template || '').toLowerCase();
    const isCoverLetter = docType.includes('cover') || template.toLowerCase().includes('cover');
    const isContract = docType.includes('contract') || template.toLowerCase().includes('contract');
    const isProposal = docType.includes('proposal') || template.toLowerCase().includes('proposal');
    const isPolicy = docType.includes('policy') || template.toLowerCase().includes('policy');
    const isSop = docType.includes('sop') || template.toLowerCase().includes('sop');
    const isJudgement = docType.includes('judgement') || docType.includes('judgment') || docType.includes('review') || template.toLowerCase().includes('review');
    const country = dto.country || dto.targetCountry || 'Qatar';
    const rawForCurrency = JSON.stringify(dto) + ' ' + template + ' ' + country + ' ' + (dto.expectedSalary||'') + ' ' + (dto.salary||'');
    const currencyInfo = this.detectCurrency(rawForCurrency, country);
    const fileName = `doc-${userId}-${Date.now()}.pdf`;
    const filePath = path.join(this.getUploadsDir(), fileName);
    let pdfBuffer: Buffer;
    if (isCoverLetter) {
      pdfBuffer = await this.createCoverLetterPdf(dto, template, currencyInfo);
    } else if (isContract) {
      pdfBuffer = await this.createContractPdf(dto, template, currencyInfo);
    } else if (isProposal) {
      pdfBuffer = await this.createProposalPdf(dto, template, currencyInfo);
    } else if (isPolicy) {
      pdfBuffer = await this.createPolicyPdf(dto, template, currencyInfo);
    } else if (isSop) {
      pdfBuffer = await this.createSopPdf(dto, template, currencyInfo);
    } else if (isJudgement) {
      pdfBuffer = await this.createJudgementReviewPdf(dto, template, currencyInfo);
    } else {
      pdfBuffer = await this.createProfessionalPdf(dto, template, currencyInfo);
    }
    fs.writeFileSync(filePath, pdfBuffer);
    const titlePrefix = isCoverLetter ? 'Cover Letter' : isJudgement ? 'Judgement Review' : 'CV';
    const doc = await this.prisma.cvDocument.create({
      data: {
        ownerId: userId,
        title: `${dto.name || dto.contact?.fullName || dto.applicantName || 'Applicant'} - ${dto.role || dto.contact?.title || dto.position || ''} ${titlePrefix} [${template}] [${currencyInfo.country} - ${currencyInfo.currency}]`,
        content: JSON.stringify({ ...dto, currencyInfo, documentCategory: titlePrefix }),
        storageKey: fileName,
        downloadMode: 'FREE',
        price: 0,
        currency: currencyInfo.currency,
      } as any,
    });
    return { id: doc.id, title: doc.title, content: doc.content, createdAt: doc.createdAt, currency: currencyInfo.currency, symbol: currencyInfo.symbol, country: currencyInfo.country };
  }

  create = this.generate;

  private createCoverLetterPdf(dto: any, template: string, curr: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks as any)));
      const name = dto.applicantName || dto.name || dto.contact?.fullName || 'Applicant Name';
      const role = dto.position || dto.role || dto.contact?.title || 'Target Role';
      const company = dto.companyName || dto.company || 'Hiring Company';
      const salary = dto.expectedSalary || dto.salary || '';
      const salaryText = salary ? `Expected Salary: ${curr.symbol}${salary} ${curr.currency}` : `Salary: Competitive in ${curr.currency}`;
      doc.rect(0, 0, 595, 85).fill('#0F172A');
      doc.fillColor('#D4AF37').fontSize(9).font('Helvetica-Bold').text(`COVER LETTER | ${curr.country.toUpperCase()} | ${curr.currency} | ${curr.compliance}`, 50, 15);
      doc.fillColor('white').fontSize(18).font('Helvetica-Bold').text(name.toUpperCase(), 50, 32);
      doc.fontSize(11).fillColor('#E5E7EB').text(`${role} | ${company} | ${salaryText}`, 50, 58);
      let y = 110;
      doc.fillColor('#111827').fontSize(10).font('Helvetica').text(`Date: ${new Date().toLocaleDateString()}`, 50, y); y+=15;
      doc.text(`To: Hiring Manager, ${company}`, 50, y); y+=15;
      doc.text(`Re: Application for ${role} - ${curr.country} Market`, 50, y); y+=25;
      doc.font('Helvetica-Bold').fontSize(11).text('Dear Hiring Manager,', 50, y); y+=18;
      doc.font('Helvetica').fontSize(10);
      const paragraphs = [
        dto.coverLetterBody || dto.body || `I am writing to express my strong interest in the ${role} position at ${company} within the ${curr.country} market. With extensive experience in ${dto.experience || 'my field'}, I am confident in my ability to contribute significantly to your team.`,
        dto.paragraph2 || `In my previous role, I have demonstrated ${dto.achievements || 'key achievements relevant to this position'}. My expertise in ${dto.skills || 'relevant skills'} aligns perfectly with the requirements for this ${curr.country} based opportunity. I understand the local compliance requirements: ${curr.law} and ${curr.compliance}.`,
        dto.paragraph3 || `I am particularly drawn to ${company} because of ${dto.motivation || 'its reputation and growth in the ' + curr.country + ' market'}. The opportunity to work in ${curr.country} with compensation in ${curr.currency} (${curr.symbol}) and tax structure ${curr.tax} is highly appealing. ${salary ? `My expected salary of ${curr.symbol}${salary} ${curr.currency} is aligned with ${curr.country} market standards.` : ''}`,
        dto.closing || `Thank you for considering my application. I would welcome the opportunity to discuss how my skills in ${dto.skills || 'my expertise'} can benefit ${company} in the ${curr.country} market. I am available for interview and can comply with ${curr.compliance} requirements. Please find my CV attached.\n\nSincerely,\n${name}\n${dto.contact?.email || dto.email || ''} | ${dto.contact?.phone || dto.phone || ''} | ${curr.country} | ${curr.currency}`
      ];
      paragraphs.forEach(p => {
        doc.text(p, 50, y, { width: 495, lineGap: 3 });
        y = doc.y + 12;
        if (y > 700) { doc.addPage(); y = 50; }
      });
      doc.fontSize(7).fillColor('#9CA3AF').text(`${template} | ${curr.country} | ${curr.currency} (${curr.symbol}) | ${curr.law} | ${curr.tax} | ${curr.compliance} | TMG Premium International`, 50, 800, { align: 'center', width: 495 });
      doc.end();
    });
  }

  private createJudgementReviewPdf(dto: any, template: string, curr: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks as any)));
      doc.rect(0, 0, 595, 85).fill('#1E293B');
      doc.fillColor('#D4AF37').fontSize(9).font('Helvetica-Bold').text(`JUDGEMENT REVIEW | ${curr.country.toUpperCase()} | ${curr.currency} | ${curr.law}`, 50, 15);
      doc.fillColor('white').fontSize(16).font('Helvetica-Bold').text(`LEGAL DOCUMENT REVIEW - ${curr.country}`, 50, 32, { width: 495 });
      doc.fontSize(9).fillColor('#E5E7EB').text(`Case Type: ${dto.caseType || dto.documentType || 'General'} | Jurisdiction: ${curr.country} | Currency Impact: ${curr.symbol} | ${curr.compliance}`, 50, 58);
      let y = 110;
      const section = (title: string) => {
        if (y > 700) { doc.addPage(); y = 50; }
        doc.fillColor('#D4AF37').fontSize(10).font('Helvetica-Bold').text(title.toUpperCase(), 50, y);
        y+=4; doc.strokeColor('#D4AF37').lineWidth(1).moveTo(50, y).lineTo(545, y).stroke(); y+=12;
        doc.fillColor('#111827').font('Helvetica').fontSize(10);
      };
      section('1. Executive Summary');
      doc.text(dto.summary || dto.content || 'Document review summary for ' + curr.country + ' jurisdiction under ' + curr.law, 50, y, { width: 495, lineGap: 3 }); y = doc.y+15;
      section(`2. Jurisdiction Analysis - ${curr.country} (${curr.currency})`);
      doc.text(`Applicable Law: ${curr.law}\nCompliance: ${curr.compliance}\nTax Implications: ${curr.tax}\nCurrency: ${curr.currency} (${curr.symbol})\nCountry: ${curr.country}`, 50, y, { width: 495, lineGap: 3 }); y = doc.y+15;
      section('3. Key Findings & Risks');
      doc.text(dto.findings || dto.risks || `Review findings under ${curr.country} law. Financial exposure in ${curr.symbol} ${curr.currency}.`, 50, y, { width: 495 }); y = doc.y+15;
      section(`4. Financial Impact - ${curr.symbol} ${curr.currency}`);
      doc.text(dto.financialImpact || `Estimated financial impact: ${curr.symbol} ${dto.amount || 'N/A'} ${curr.currency}\nLegal fees: ${curr.symbol} estimated under ${curr.country} fee structure\nTax: ${curr.tax}`, 50, y, { width: 495 }); y = doc.y+15;
      section('5. Recommendations');
      doc.text(dto.recommendations || `Comply with ${curr.law}, ensure ${curr.compliance}, seek local counsel in ${curr.country} for ${curr.currency} transactions.`, 50, y, { width: 495 }); y = doc.y+15;
      section('6. Disclaimer');
      doc.fontSize(8).fillColor('#64748B').text(`This review is for informational purposes under ${curr.country} jurisdiction (${curr.law}). Not legal advice. Consult qualified ${curr.country} attorney. Generated by TMG Premium International | ${curr.currency}`, 50, y, { width: 495 });
      doc.fontSize(7).fillColor('#9CA3AF').text(`Judgement Review | ${curr.country} | ${curr.currency} (${curr.symbol}) | ${curr.law} | Confidential | TMG ${new Date().getFullYear()}`, 50, 800, { align: 'center', width: 495 });
      doc.end();
    });
  }

  private createProfessionalPdf(dto: any, template: string, curr: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks as any)));
      const data = dto.contact ? dto : {
        contact: { fullName: dto.name, title: dto.role, email: dto.email, phone: dto.phone, location: dto.location || curr.country, linkedin: dto.linkedin },
        summary: dto.summary, exps: dto.exps || [], edus: dto.edus || [], skills: dto.skills, langs: dto.langs, certs: dto.certs
      };
      const contact = data.contact || {};
      const fullName = (contact.fullName || dto.name || 'Your Name').toUpperCase();
      const title = contact.title || dto.role || '';
      const TPL: any = {
        'Qatar Professional': { header: '#0F172A', accent: '#D4AF37', textHeader: '#D4AF37' },
        'Corporate Executive': { header: '#1E3A8A', accent: '#3B82F6', textHeader: 'white' },
        'ATS Minimal': { header: '#FFFFFF', accent: '#111827', textHeader: 'black' },
        'International Standard': { header: '#0F172A', accent: '#10B981', textHeader: 'white' },
        'Australia Professional': { header: '#0F172A', accent: '#0066CC', textHeader: 'white' },
        'UK Professional': { header: '#1E293B', accent: '#8B0000', textHeader: 'white' },
        'US Standard': { header: '#0F172A', accent: '#D4AF37', textHeader: 'white' },
      };
      const cfg = TPL[template] || TPL['Qatar Professional'];
      const checkPage = (need = 100) => { if (doc.y + need > 770) { doc.addPage(); doc.y = 40; } };
      if (template !== 'ATS Minimal') {
        doc.rect(0, 0, 595, 105).fill(cfg.header);
        doc.fillColor('#D4AF37').fontSize(7).font('Helvetica-Bold').text(`${curr.country.toUpperCase()} | ${curr.currency} (${curr.symbol}) | ${curr.compliance} | ${curr.law}`, 40, 8);
        doc.fillColor(cfg.textHeader).fontSize(22).font('Helvetica-Bold').text(fullName, 40, 22, { width: 515 });
        doc.fillColor(template === 'Qatar Professional' ? '#E5E7EB' : 'white').fontSize(11).font('Helvetica').text(`${title} | ${curr.country} | Expected: ${curr.symbol} ${dto.expectedSalary || dto.salary || 'Competitive'} ${curr.currency}`, 40, 50);
        doc.fontSize(9).text(`${contact.email || ''} ${contact.phone ? '| ' + contact.phone : ''} ${contact.location ? '| ' + contact.location : '| ' + curr.country} ${contact.linkedin ? '| ' + contact.linkedin : ''}`, 40, 68, { width: 515 });
        doc.fontSize(7).fillColor('#94A3B8').text(`${curr.law} | ${curr.tax}`, 40, 82, { width: 515 });
        doc.y = 125;
      } else {
        doc.fillColor('#D4AF37').fontSize(7).font('Helvetica-Bold').text(`${curr.country} | ${curr.currency} | ${curr.compliance}`, 40, 10);
        doc.fillColor('black').fontSize(24).font('Helvetica-Bold').text(fullName, 40, 35);
        doc.fontSize(12).font('Helvetica').text(`${title} | ${curr.country} | ${curr.currency}`, 40, 62);
        doc.fontSize(9).fillColor('#475569').text(`${contact.email || ''} | ${contact.phone || ''} | ${contact.location || curr.country} | Salary: ${curr.symbol} ${dto.expectedSalary || 'Negotiable'} ${curr.currency}`, 40, 80);
        doc.y = 120;
      }
      doc.fillColor('black');
      const left = 40; const width = 515;
      const section = (t: string) => {
        checkPage(60); doc.moveDown(0.6);
        doc.fillColor(cfg.accent).fontSize(11).font('Helvetica-Bold').text(t.toUpperCase(), left);
        doc.moveDown(0.15).strokeColor(cfg.accent).lineWidth(1).moveTo(left, doc.y).lineTo(left + width, doc.y).stroke().moveDown(0.6);
        doc.fillColor('#111827').font('Helvetica').fontSize(10);
      };
      if (data.summary) { section('Professional Summary - ' + curr.country); doc.text(data.summary + ` | Target Market: ${curr.country} | Compliance: ${curr.compliance}`, left, doc.y, { width, lineGap: 2 }); }
      const exps = data.exps?.filter((e: any) => e.title || e.bullets) || [];
      if (exps.length) {
        section('Professional Experience - ' + curr.currency);
        exps.forEach((e: any) => {
          checkPage(80);
          doc.font('Helvetica-Bold').fontSize(10).text(`${e.title}${e.company ? ` at ${e.company}` : ''} ${e.location ? `| ${e.location}` : `| ${curr.country}`}`, left, doc.y, { width });
          doc.font('Helvetica').fontSize(9).fillColor('#475569').text(`${e.from || ''} - ${e.current ? 'Present' : e.to || 'Present'} | Salary: ${curr.symbol} ${e.salary || ''} ${curr.currency} | ${curr.country}`, left);
          doc.fillColor('#111827').fontSize(10).text(e.bullets || '', left, doc.y, { width, lineGap: 2 }); doc.moveDown(0.6);
        });
      }
      const edus = data.edus?.filter((e: any) => e.degree) || [];
      if (edus.length) { section('Education - ' + curr.country); edus.forEach((ed: any) => { checkPage(30); doc.text(`${ed.degree} - ${ed.school} (${ed.year}) | ${curr.country} | ${curr.compliance}`, left, doc.y, { width }); }); }
      if (data.skills) { checkPage(40); section('Core Skills - ' + curr.currency); doc.text(data.skills + ` | ${curr.country} market relevant`, left, doc.y, { width }); }
      if (data.langs) { checkPage(40); section('Languages - International'); doc.text(data.langs, left, doc.y, { width }); }
      if (data.certs) { checkPage(40); section('Certifications - ' + curr.country); doc.text(data.certs + ` | ${curr.compliance}`, left, doc.y, { width }); }
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(7).fillColor('#9CA3AF').text(`${template} | ${curr.country} | ${curr.currency} (${curr.symbol}) | ${curr.law} | ${curr.tax} | ${curr.compliance} | International ATS 95%+ | TMG Premium`, 40, 820, { align: 'center', width: 515 });
      }
      doc.end();
    });
  }
  // ===== POLICY & SOP DEDICATED PDFS =====
  private createPolicyPdf(dto: any, template: string, curr: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks as any)));
      doc.rect(0, 0, 595, 90).fill('#0F172A');
      doc.fillColor('#D4AF37').fontSize(8).font('Helvetica-Bold').text(`POLICY DOCUMENT | ${curr.country.toUpperCase()} | ${curr.currency} (${curr.symbol}) | ${curr.law}`, 50, 12);
      doc.fillColor('white').fontSize(18).font('Helvetica-Bold').text((dto.policyType || 'HR Policy').toUpperCase(), 50, 28);
      doc.fontSize(11).fillColor('#E5E7EB').text(`${dto.companyName || 'Company'} | ${curr.country} | ${curr.currency} | Employee Count: ${dto.employeeCount || 'N/A'} | ${curr.compliance}`, 50, 52);
      let y = 110;
      const sec = (t: string) => {
        if (y > 700) { doc.addPage(); y = 50; }
        doc.fillColor('#D4AF37').fontSize(11).font('Helvetica-Bold').text(t.toUpperCase(), 50, y); y+=4; doc.strokeColor('#D4AF37').lineWidth(1).moveTo(50, y).lineTo(545, y).stroke(); y+=14; doc.fillColor('#111827').font('Helvetica').fontSize(10);
      };
      sec('1. Purpose');
      doc.text(dto.summary || dto.content || `Policy purpose for ${curr.country} under ${curr.law}`, 50, y, { width: 495, lineGap: 3 }); y = doc.y+15;
      sec(`2. Scope - ${curr.country} ${curr.currency}`);
      doc.text(`Applies to all employees in ${curr.country} jurisdiction. Industry: ${dto.industry || 'General'}. Compliance: ${curr.compliance}. Currency implications: ${curr.symbol} ${curr.currency}.`, 50, y, { width: 495 }); y = doc.y+15;
      sec(`3. Compliance - ${curr.law}`);
      doc.text(`This policy complies with ${curr.law}. Tax: ${curr.tax}. ${dto.complianceNotes || ''} All financial references in ${curr.symbol} ${curr.currency}.`, 50, y, { width: 495 }); y = doc.y+15;
      sec('4. Policy Statement');
      doc.text(dto.summary || 'Policy statement content', 50, y, { width: 495 }); y = doc.y+15;
      sec('5. Responsibilities');
      doc.text(`Management in ${curr.country} responsible for implementation under ${curr.law}. Employees must comply with ${curr.compliance}.`, 50, y, { width: 495 }); y = doc.y+15;
      sec('6. Enforcement');
      doc.text(`Non-compliance under ${curr.country} law ${curr.law} may result in disciplinary action.`, 50, y, { width: 495 });
      doc.fontSize(7).fillColor('#9CA3AF').text(`Policy | ${curr.country} | ${curr.currency} (${curr.symbol}) | ${curr.law} | ${curr.tax} | Confidential | TMG Premium ${new Date().getFullYear()}`, 50, 810, { align: 'center', width: 495 });
      doc.end();
    });
  }

  private createSopPdf(dto: any, template: string, curr: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks as any)));
      doc.rect(0, 0, 595, 90).fill('#1E3A8A');
      doc.fillColor('#D4AF37').fontSize(8).font('Helvetica-Bold').text(`SOP DOCUMENT | ${curr.country.toUpperCase()} | ${curr.currency} | ${curr.law}`, 50, 12);
      doc.fillColor('white').fontSize(18).font('Helvetica-Bold').text((dto.sopType || 'Operations SOP').toUpperCase(), 50, 28);
      doc.fontSize(11).fillColor('#E5E7EB').text(`${dto.companyName || 'Company'} | Dept: ${dto.department || 'Operations'} | ${curr.country} | ${curr.compliance}`, 50, 52);
      let y = 110;
      const sec = (t: string) => {
        if (y > 700) { doc.addPage(); y = 50; }
        doc.fillColor('#3B82F6').fontSize(11).font('Helvetica-Bold').text(t.toUpperCase(), 50, y); y+=4; doc.strokeColor('#3B82F6').lineWidth(1).moveTo(50, y).lineTo(545, y).stroke(); y+=14; doc.fillColor('#111827').font('Helvetica').fontSize(10);
      };
      sec('1. Purpose / Objective');
      doc.text(dto.purpose || dto.summary || `SOP purpose for ${curr.country}`, 50, y, { width: 495 }); y = doc.y+15;
      sec('2. Scope & Compliance');
      doc.text(`Scope: ${dto.department || 'All'} in ${curr.country}. Law: ${curr.law}. Currency: ${curr.symbol} ${curr.currency}. Compliance: ${curr.compliance}`, 50, y, { width: 495 }); y = doc.y+15;
      sec('3. Responsibilities');
      doc.text(`Roles responsible under ${curr.country} ${curr.law} for this SOP.`, 50, y, { width: 495 }); y = doc.y+15;
      sec('4. Procedure - Step by Step');
      doc.text(dto.steps || dto.purpose || 'Step 1: ...\nStep 2: ...\nStep 3: ...', 50, y, { width: 495 }); y = doc.y+15;
      sec('5. Tools & Systems');
      doc.text(dto.tools || `Tools for ${curr.country} operations in ${curr.currency}`, 50, y, { width: 495 }); y = doc.y+15;
      sec(`6. References - ${curr.country} ${curr.currency}`);
      doc.text(`Compliance refs: ${curr.law}, ${curr.tax}, ${curr.compliance}. All costs in ${curr.symbol} ${curr.currency}.`, 50, y, { width: 495 });
      doc.fontSize(7).fillColor('#9CA3AF').text(`SOP | ${curr.country} | ${curr.currency} (${curr.symbol}) | ${curr.law} | TMG Premium ${new Date().getFullYear()}`, 50, 810, { align: 'center', width: 495 });
      doc.end();
    });
  }
  private createContractPdf(dto: any, template: string, curr: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks as any)));
      doc.rect(0,0,595,90).fill('#0F172A');
      doc.fillColor('#D4AF37').fontSize(8).font('Helvetica-Bold').text(`BUSINESS CONTRACT | ${curr.country.toUpperCase()} | ${curr.currency} (${curr.symbol}) | ${curr.law}`, 50, 12);
      doc.fillColor('white').fontSize(16).font('Helvetica-Bold').text((dto.contractType || 'SERVICE AGREEMENT').toUpperCase(), 50, 28);
      doc.fontSize(10).fillColor('#E5E7EB').text(`${dto.companyName || 'Company'} ↔ ${dto.clientName || 'Client'} | Value: ${curr.symbol}${dto.contractValue || '0'} ${curr.currency} | ${curr.country}`, 50, 52);
      let y=110;
      const sec=(t:string)=>{ if(y>700){doc.addPage(); y=50;} doc.fillColor('#D4AF37').fontSize(11).font('Helvetica-Bold').text(t.toUpperCase(),50,y); y+=4; doc.strokeColor('#D4AF37').moveTo(50,y).lineTo(545,y).stroke(); y+=14; doc.fillColor('#111827').font('Helvetica').fontSize(10); };
      sec('1. Parties'); doc.text(`Party A: ${dto.companyName || 'Company'}\nParty B: ${dto.clientName || 'Client'}\nJurisdiction: ${curr.country} | Governing Law: ${dto.governingLaw || curr.law}`,50,y,{width:495}); y=doc.y+12;
      sec(`2. Scope of Work`); doc.text(dto.scope || dto.content || 'Scope details',50,y,{width:495}); y=doc.y+12;
      sec(`3. Financial Terms - ${curr.symbol} ${curr.currency}`); doc.text(`Contract Value: ${curr.symbol}${dto.contractValue || '0'} ${curr.currency}\nPayment Terms: ${dto.paymentTerms || 'Net 30'}\nAll amounts in ${curr.symbol} ${curr.currency}. Tax: ${curr.tax}`,50,y,{width:495}); y=doc.y+12;
      sec('4. Term'); doc.text(`Start: ${dto.startDate || 'Upon signing'} | End: ${dto.endDate || 'Per SOW'}\nCountry: ${curr.country}`,50,y,{width:495}); y=doc.y+12;
      sec('5. Confidentiality & IP'); doc.text(dto.confidentiality || 'Confidentiality under local law',50,y,{width:495}); y=doc.y+12;
      sec('6. Termination'); doc.text(dto.termination || `Termination under ${curr.law}`,50,y,{width:495}); y=doc.y+12;
      sec(`7. Governing Law - ${curr.country}`); doc.text(`${dto.governingLaw || curr.law}\nCompliance: ${curr.compliance} | Currency: ${curr.symbol} ${curr.currency}`,50,y,{width:495});
      doc.fontSize(7).fillColor('#9CA3AF').text(`Contract | ${curr.country} | ${curr.currency} (${curr.symbol}) | ${curr.law} | TMG Premium ${new Date().getFullYear()}`,50,810,{align:'center',width:495});
      doc.end();
    });
  }
  private createProposalPdf(dto: any, template: string, curr: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks as any)));
      doc.rect(0,0,595,90).fill('#0F172A');
      doc.fillColor('#D4AF37').fontSize(8).font('Helvetica-Bold').text(`PROPOSAL PACK | ${curr.country.toUpperCase()} | ${curr.currency} (${curr.symbol}) | ${curr.law}`, 50, 12);
      doc.fillColor('white').fontSize(16).font('Helvetica-Bold').text((dto.proposalType || 'BUSINESS PROPOSAL').toUpperCase(), 50, 28);
      doc.fontSize(10).fillColor('#E5E7EB').text(`${dto.companyName || 'Company'} → ${dto.clientName || 'Client'} | ${dto.projectTitle || 'Project'} | ${curr.symbol}${dto.investment || '0'} ${curr.currency}`, 50, 52);
      let y=110;
      const sec=(t:string)=>{ if(y>680){doc.addPage(); y=50;} doc.fillColor('#D4AF37').fontSize(11).font('Helvetica-Bold').text(t.toUpperCase(),50,y); y+=4; doc.strokeColor('#D4AF37').moveTo(50,y).lineTo(545,y).stroke(); y+=14; doc.fillColor('#111827').font('Helvetica').fontSize(10); };
      sec('Executive Summary'); doc.text(dto.executiveSummary || dto.summary || 'Summary',50,y,{width:495}); y=doc.y+12;
      sec('Problem Statement'); doc.text(dto.problem || 'Problem',50,y,{width:495}); y=doc.y+12;
      sec('Our Solution'); doc.text(dto.solution || 'Solution',50,y,{width:495}); y=doc.y+12;
      sec('Deliverables'); doc.text(dto.deliverables || 'Deliverables',50,y,{width:495}); y=doc.y+12;
      sec(`Investment & ROI - ${curr.symbol} ${curr.currency}`); doc.text(`Investment: ${curr.symbol}${dto.investment || '0'} ${curr.currency}\nROI: ${dto.roi || 'High ROI'}\nTimeline: ${dto.timeline || '4-6 weeks'}\nTax: ${curr.tax} | Law: ${curr.law}\nAll figures in ${curr.symbol} ${curr.currency} for ${curr.country} market.`,50,y,{width:495});
      doc.fontSize(7).fillColor('#9CA3AF').text(`Proposal | ${curr.country} | ${curr.currency} (${curr.symbol}) | ${curr.law} | TMG Premium ${new Date().getFullYear()}`,50,810,{align:'center',width:495});
      doc.end();
    });
  }





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

  async getFilePath(id: string, user: AuthenticatedUser, wantDownload: boolean) {
    const docRecord = await this.get(user, id);
    const filePath = path.join(this.getUploadsDir(), docRecord.storageKey);
    if (!fs.existsSync(filePath)) throw new NotFoundException('File not found');
    return { filePath, doc: docRecord };
  }

  async remove(user: AuthenticatedUser, id: string) {
    const doc = await this.get(user, id);
    const filePath = path.join(this.getUploadsDir(), doc.storageKey);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await this.prisma.cvDocument.delete({ where: { id } as any });
    return { deleted: true };
  }

  async setDownloadControl(id: string, body: any) {
    const doc = await this.prisma.cvDocument.findFirst({ where: { id } as any });
    if (!doc) throw new NotFoundException('Document not found');
    return this.prisma.cvDocument.update({ 
      where: { id } as any, 
      data: { downloadMode: body.downloadMode || body.mode || 'FREE', price: body.price || 0 } as any 
    });
  }

  async grantFreeAccess(id: string, userId: string) {
    const doc = await this.prisma.cvDocument.findFirst({ where: { id } as any });
    if (!doc) throw new NotFoundException('Document not found');
    return { id, grantedTo: userId, access: 'free', title: doc.title };
  }
}


