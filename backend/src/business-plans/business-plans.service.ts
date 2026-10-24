import { Injectable, NotFoundException } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class BusinessPlansService {
  private plans: Map<string, any> = new Map();

  async generate(user: any, body: any) {
    const id = 'plan-'+Date.now();
    const plan = { id, ...body, userId: user?.id||'anon', createdAt: new Date(), status: 'generated' };
    this.plans.set(id, plan);
    console.log('Saved plan', id, 'with businessName', body.businessName);
    return plan;
  }
  async list(user: any) { return Array.from(this.plans.values()).reverse(); }
  async listAll() { return this.list({}); }
  async get(user: any, id: string) {
    if(this.plans.has(id)) return this.plans.get(id);
    // fallback mock if not found
    return { 
      id, 
      title: 'Australia SBA Plan', 
      template: 'US SBA - Australia (AUD)', 
      businessName: 'Test Australia Business',
      industry: 'Tech',
      executiveSummary: 'International investor plan',
      marketAnalysis: 'Australia market',
      products: 'Product description',
      financials: 'Startup: 50000 AUD',
      fundingAsk: 'AUD 500K',
      startupCost: '50000', monthlyExpense: '20000', monthlyRevenue: '4000000', annualRevenue: '10000000', breakEven: '6 months', risks: 'Low Risk', mitigation: 'check for me',
      createdAt: new Date()
    };
  }
  async findOne(id: string) { return this.get({}, id); }
  async getFilePath(id: string, user: any, wantDownload: boolean) {
    const plan=await this.get(user, id);
    const pdfBuffer=await this.generateInternationalPdf(plan);
    return { buffer: pdfBuffer, plan };
  }
  async setDownloadControl(id: string, body: any) { return { id, ...body }; }

  async generateInternationalPdf(plan: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc=new PDFDocument({ size:'A4', margin:50, bufferPages:true });
      const buffers:any[]=[]; doc.on('data', buffers.push.bind(buffers)); doc.on('end', ()=>resolve(Buffer.concat(buffers)));
      const raw = (JSON.stringify(plan) + ' ' + (plan.template||'')).toUpperCase();
      let currency='USD'; let symbol='$';
      if(raw.includes('AUD')||raw.includes('A$')||raw.includes('AUSTRALIA')){ currency='AUD'; symbol='A$'; }
      else if(raw.includes('QAR')){ currency='QAR'; symbol='QAR '; }
      else if(raw.includes('GBP')||raw.includes('£')||raw.includes('UK')){ currency='GBP'; symbol='£'; }
      else if(raw.includes('SAR')){ currency='SAR'; symbol='SAR '; }
      else if(raw.includes('AED')||raw.includes('UAE')){ currency='AED'; symbol='AED '; }
      else if(raw.includes('EUR')||raw.includes('€')){ currency='EUR'; symbol='€'; }
      else if(raw.includes('CAD')){ currency='CAD'; symbol='C$'; }
      else if(raw.includes('INR')){ currency='INR'; symbol='₹'; }
      else if(raw.includes('SGD')){ currency='SGD'; symbol='S$'; }
      const template=plan.template||'International Investor'; const isQatar=template.includes('Qatar')||raw.includes('QAR'); const isSBA=template.includes('SBA'); const isAustralia=template.includes('Australia')||raw.includes('AUD'); const title=plan.title||plan.businessName||'Business Plan';
      const section=(num:string,t:string)=>{ doc.addPage(); doc.fillColor('#D4AF37').fontSize(10).text('SECTION '+num,50,50); doc.fillColor('#000').fontSize(18).font('Helvetica-Bold').text(t,50,70); doc.fillColor('#D4AF37').rect(50,95,40,3).fill(); doc.moveDown(1.5); doc.fillColor('#000').font('Helvetica').fontSize(10); };
      const para=(text:string)=>{ if(!text) text='N/A'; doc.fontSize(10).fillColor('#222').text(text,{lineGap:4, width:500}); doc.moveDown(); };
      const tableRow=(cols:string[],yPos:number)=>{ const colW=125; cols.forEach((c,i)=>{ doc.font('Helvetica').fontSize(8).text(c,50+i*colW,yPos,{width:colW-10}); }); };
      doc.rect(0,0,doc.page.width,doc.page.height).fill('#0a0a0a'); doc.fillColor('#D4AF37').fontSize(10).font('Helvetica-Bold').text('TMG BUSINESS CONSULTING',50,50); doc.fillColor('#fff').fontSize(24).font('Helvetica-Bold').text(title.toUpperCase(),50,130,{width:500}); doc.fillColor('#D4AF37').fontSize(14).text(template,50,210); doc.fillColor('#fff').fontSize(11).text('Country: '+(isAustralia?'Australia': isQatar?'Qatar':'International')+' | Currency: '+currency+' ('+symbol+')',50,240); doc.fillColor('#fff').fontSize(9).text('Financials: '+(plan.financials||'N/A').substring(0,200),50,270,{width:500});
      section('0','Table of Contents - '+currency); const toc=['1. Executive Summary ('+currency+')','2. Company Overview','3. Products & Services','4. Market Analysis - '+currency,'5. Competitive Analysis','6. Marketing & Sales','7. Operations','8. Management Team','9. Financial Plan - '+symbol,'10. SWOT Analysis','11. Risk Assessment - '+symbol,'12. Funding Ask - '+symbol]; toc.forEach((t,i)=>{ doc.fontSize(10).fillColor('#000').text(t,60,120+i*20); doc.text(''+(i+2),500,120+i*20); });
      section('1','Executive Summary - '+currency+' ('+symbol+')'); para(plan.executiveSummary||plan.businessDescription||''); if(isAustralia){ doc.font('Helvetica-Bold').text('Australia Compliance Note:'); para('ABN registered, ASIC compliance, AUD currency, GST 10%'); } if(isQatar){ doc.font('Helvetica-Bold').text('Qatar QFC Compliance:'); para('QFC LLC, QDB requirements, QAR currency.'); } if(isSBA){ doc.font('Helvetica-Bold').text('SBA 7(a) Compliance:'); para('SBA Form 1919, Collateral Schedule for '+currency+' market.'); }
      section('2','Company Overview'); para('Name: '+(plan.businessName||title)+'\nIndustry: '+(plan.industry||'')+'\nTemplate: '+template+'\nCurrency: '+currency+' ('+symbol+')\nFinancials: '+(plan.financials||'')+'\nStartup: '+symbol+(plan.startupCost||'50000'));
      section('3','Products & Services'); para(plan.products||plan.productsServices||'');
      section('4','Market Analysis - '+currency); para(plan.marketAnalysis||'Market size in '+symbol); para('Market Size: '+symbol+' '+(plan.monthlyRevenue||'4,000,000')+' monthly, '+symbol+' '+(plan.annualRevenue||'10,000,000')+' annual.');
      section('5','Competitive Analysis'); doc.font('Helvetica-Bold').fontSize(11).text('Competitor Matrix - '+symbol,50,doc.y); doc.moveDown(); let y=doc.y; doc.rect(50,y,500,18).fill('#141414'); doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(8); tableRow(['Competitor','Strengths','Weaknesses','Market Share'],y+4); y+=22; doc.fillColor('#000').font('Helvetica'); [1,2,3].forEach(i=>{ doc.rect(50,y,500,28).strokeColor('#ddd').stroke(); tableRow(['Competitor '+i, 'Brand, Funding', 'Limited tech', '20%'],y+6); y+=30; });
      section('6','Marketing & Sales Strategy'); para((plan.marketAnalysis||'')+' Channels: '+(plan.marketingChannels||'')); section('7','Operations & Technology'); para(plan.products||'Operations plan for '+currency+' market.'); section('8','Management Team'); para(plan.financials||'Management team with experience in '+currency+' market.');
      section('9','Financial Plan - '+currency+' ('+symbol+')'); para('Startup Cost: '+symbol+' '+(plan.startupCost||'50000')+'\nMonthly Expense: '+symbol+' '+(plan.monthlyExpense||'20000')+'\nMonthly Revenue: '+symbol+' '+(plan.monthlyRevenue||'4000000')+'\nAnnual Revenue: '+symbol+' '+(plan.annualRevenue||'10000000')+'\nBreak-Even: '+(plan.breakEven||'6 months')); y=doc.y+10; doc.rect(50,y,500,18).fill('#141414'); doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(8); tableRow(['Year','Revenue ('+symbol+')','Expenses ('+symbol+')','Profit ('+symbol+')'],y+4); y+=22; doc.fillColor('#000').font('Helvetica'); [1,2,3].forEach(yr=>{ const rev= (parseInt(plan.annualRevenue)||1000000) * Math.pow(1.5, yr-1) / 3; const exp=rev*0.6; const profit=rev-exp; doc.rect(50,y,500,20).strokeColor('#ddd').stroke(); tableRow(['Year '+yr, symbol+' '+Math.round(rev).toLocaleString(), symbol+' '+Math.round(exp).toLocaleString(), symbol+' '+Math.round(profit).toLocaleString()],y+5); y+=22; });
      section('10','SWOT Analysis - '+currency); y=doc.y; const swot=[['Strengths - '+symbol,'Experienced team, Unique USP in '+currency+' market'],['Weaknesses - '+symbol,'Limited initial capital '+symbol],['Opportunities - '+symbol,'Market size '+symbol+' growth, '+currency+' funding'],['Threats - '+symbol,'Competition, Regulation in '+currency+' market']]; swot.forEach(([k,v])=>{ doc.rect(50,y,240,55).fillAndStroke(k.includes('Strengths')||k.includes('Opportunities')?'#E8F5E9':'#FFF3E0','#ccc'); doc.fillColor('#000').font('Helvetica-Bold').fontSize(9).text(k,60,y+6); doc.font('Helvetica').fontSize(8).text(v,60,y+20,{width:220}); y+=62; if(y>650){ doc.addPage(); y=100; } });
      section('11','Risk Assessment - '+symbol); doc.font('Helvetica-Bold').text('Risks: '+(plan.risks||'Low Risk')); para('Risk Level: '+(plan.risks||'Low Risk - Stable Market')); doc.font('Helvetica-Bold').text('Mitigation Strategy:'); para(plan.mitigation||'Mitigation for '+currency+' market risks. Break-even: '+(plan.breakEven||'6 months'));
      section('12','Funding Ask & Use of Funds - '+currency+' ('+symbol+')'); para(plan.fundingAsk||'Funding: '+symbol+' 500K'); y=doc.y; const uses=[['Technology 35% '+symbol,'Marketing 25% '+symbol],['Operations 25% '+symbol,'Legal/ASIC 15% '+symbol]]; uses.forEach(row=>{ doc.rect(50,y,500,20).strokeColor('#ddd').stroke(); tableRow(row,y+5); y+=22; });
      section('Appendix','Appendix - '+template+' - '+currency); para('Generated by TMG. Plan Type: '+template+'. Currency: '+currency+' ('+symbol+'). For: '+title+'. Financials: Startup '+symbol+(plan.startupCost||'')+', Monthly '+symbol+(plan.monthlyExpense||'')+', Revenue '+symbol+(plan.monthlyRevenue||'')+'. Break-even: '+(plan.breakEven||'')+'. Risk: '+(plan.risks||'')+'. Mitigation: '+(plan.mitigation||'')+'. Confidential - TMG '+new Date().getFullYear());
      const pages=doc.bufferedPageRange(); for(let i=0;i<pages.count;i++){ doc.switchToPage(i); doc.fontSize(7).fillColor('#888').text('TMG Business Consultant | '+template+' | '+currency+' ('+symbol+') | Page '+(i+1)+'/'+pages.count+' | Confidential',50,doc.page.height-30,{align:'center',width:500}); } doc.end();
    });
  }
  async getPdfFile(planId: string, user?: any): Promise<Buffer> {
    const plan=user ? await this.get(user, planId) : await this.findOne(planId);
    return this.generateInternationalPdf(plan);
  }
}
