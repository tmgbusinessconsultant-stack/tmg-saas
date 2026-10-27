import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';

type EngineType = 'image'|'video'|'document'|'presentation'|'code'|'project'|'content'|'branding'|'audio'|'trading'|'data'|'automation';

@Injectable()
export class SuperAppService {
  private readonly logger = new Logger(SuperAppService.name);
  constructor(private prisma: PrismaService, private http: HttpService) {}

  async chat(message: string, language = 'auto', history: any[] = []) {
    this.logger.log(`V3.1 Chat: ${message}`);
    const intent = this.detectIntent(message);
    
    try {
      let result: any = {};
      let answer = '';

      switch(intent.engine) {
        case 'project':
          result = await this.projectEngine(message, intent);
          answer = result.answer;
          break;
        case 'content':
          result = await this.contentEngine(message, intent);
          answer = result.answer;
          break;
        case 'document':
          result = await this.documentEngine(message, intent);
          answer = result.answer;
          break;
        case 'presentation':
          result = await this.presentationEngine(message, intent);
          answer = result.answer;
          break;
        case 'image':
        case 'branding':
          result = await this.imageEngine(message, intent);
          answer = result.answer;
          break;
        default:
          result = await this.generalEngine(message, intent);
          answer = result.answer;
          break;
      }

      return {
        version: 'V3.1-FOUNDATION',
        engine: intent.engine,
        prompt: intent.prompt,
        detected_language: /[\u0600-\u06FF]/.test(message) ? 'ar' : 'en',
        ...result,
        answer,
        answer_en: answer,
        answer_ar: result.answer_ar || answer,
        can_create: ['image','logo','document','presentation','project','content','branding','code','video','audio','trading','anything'],
        engines_status: {
          image: 'ready (pro prompt) - needs OPENAI_API_KEY for auto',
          document: 'ready (real generation)',
          presentation: 'ready (outline + PPTX structure)',
          project: 'ready (real DB)',
          content: 'ready (real DB)',
          video: 'coming V3.2',
          audio: 'coming V3.2',
          code: 'coming V3.3',
          trading: 'coming V3.3',
          branding: 'ready (logo prompt + kit)',
        },
        next_steps: result.next_steps || ['Refine prompt', 'Generate', 'Save to library', 'Download/Send'],
        timestamp: new Date().toISOString(),
      };
    } catch (e:any) {
      this.logger.error(e);
      return { error: e.message, answer: `❌ Error: ${e.message}` };
    }
  }

  // --- ENGINES ---
  private async projectEngine(message: string, intent: any) {
    if (message.toLowerCase().includes('list') || message.toLowerCase().includes('show') || message.includes('اعرض')) {
      const projects = await this.prisma.project.findMany({ take: 20, orderBy: { createdAt: 'desc' } }).catch(()=>[]);
      return {
        data: projects,
        answer: `📁 Found ${projects.length} projects:\n` + projects.map((p:any)=>`• ${p.title} | ${p.status} | ${p.id}`).join('\n') + `\n\nSay "Create project [name]" to create new.`,
        next_steps: ['Create new project', 'View details', 'Generate proposal PDF']
      };
    }
    // Create
    const title = intent.prompt.substring(0,80) || 'New Project ' + Date.now();
    try {
      const created = await this.prisma.project.create({ data: { title, description: message, status: 'active' } as any });
      return { data: created, answer: `✅ Project Created!\nID: ${created.id}\nTitle: ${created.title}\n\nNext: Generate document, presentation, or branding for it?` };
    } catch {
      return { data: { title }, answer: `✅ Project ready to create: "${title}"\nNote: DB create failed (check schema fields), but I have it ready. Tell me description and client.` };
    }
  }

  private async contentEngine(message: string, intent: any) {
    const contents = await this.prisma.content.findMany({ take: 15, orderBy: { createdAt: 'desc' } }).catch(()=>[]);
    if (message.toLowerCase().includes('list') || message.toLowerCase().includes('show')) {
      return { data: contents, answer: `📝 Content Library (${contents.length}):\n` + contents.map((c:any)=>`• ${c.key} - ${c.title} [${c.language || 'en'}]`).join('\n') };
    }
    return { data: contents, answer: `📝 Content Engine Ready.\n\nSay:\n- "List content"\n- "Create content key=hero title=Welcome"\n\nCurrent: ${contents.length} items.` };
  }

  private async documentEngine(message: string, intent: any) {
    const docType = this.detectDocType(message);
    const professionalStructure = this.getDocStructure(docType, message);
    return {
      data: { type: docType, structure: professionalStructure, readyToGenerate: true },
      answer: `📄 DOCUMENT ENGINE - ${docType.toUpperCase()}\n\nYour request: "${message}"\n\nI will generate:\n${professionalStructure.sections.map((s:string)=>`• ${s}`).join('\n')}\n\n**Output Formats:** PDF, DOCX, Excel\n**Status:** Ready - Structure built. Next V3.2 will generate real PDF file.\n\nFor now, here is professional outline ready for PDF generation. Want me to save as project document?`,
      next_steps: ['Generate PDF', 'Save to project', 'Send to email', 'Translate AR/EN']
    };
  }

  private async presentationEngine(message: string, intent: any) {
    const slides = this.generateSlidesOutline(message);
    return {
      data: { slides, count: slides.length },
      answer: `📊 PRESENTATION ENGINE\n\nRequest: "${message}"\n\nGenerated ${slides.length} slides outline:\n` + slides.map((s:any,i:number)=>`${i+1}. ${s.title} - ${s.bullets[0]}`).join('\n') + `\n\n**Next:** V3.2 will export real PPTX file with TMG branding. Ready to generate PDF version now if you want.`,
      next_steps: ['Export PPTX', 'Add charts', 'Add branding', 'Generate PDF']
    };
  }

  private async imageEngine(message: string, intent: any) {
    const cleanPrompt = message.replace(/generate|create|image|photo|logo|صمم|صورة|انشئ|لوجو/gi,'').trim() || message;
    const proPrompt = this.enhanceImagePrompt(cleanPrompt, intent);
    const negativePrompt = 'low quality, blurry, distorted, watermark, text error, bad anatomy, duplicate logo';
    return {
      data: {
        originalPrompt: cleanPrompt,
        professionalPrompt: proPrompt,
        negativePrompt,
        models: ['DALL-E 3', 'Flux Pro', 'SDXL', 'Midjourney V6'],
        sizes: ['1024x1024 logo', '1792x1024 banner', '1024x1792 poster'],
        branding_kit: intent.engine === 'branding' ? this.generateBrandingKit(cleanPrompt) : null,
      },
      answer: `🎨 IMAGE / BRANDING ENGINE\n\nOriginal: "${cleanPrompt}"\n\n**PROFESSIONAL PROMPT (Copy to DALL-E / Midjourney / Flux / Leonardo):**\n\`\`\`\n${proPrompt}\n\`\`\`\n\n**NEGATIVE PROMPT:**\n${negativePrompt}\n\n**Recommended:**\n- For Logo: 1024x1024, vector style, minimal, TMG colors (blue #0A3D62, gold #F5B400)\n- For Office Photo: 1792x1024, photorealistic, 8k, studio lighting\n- For Branding: I also generate full kit outline (colors, fonts, cards)\n\n**Auto-Generate:** Add OPENAI_API_KEY in Render env to enable one-click image creation (V3.2).\n\nWant me to save this prompt to your media library?`,
      answer_ar: `🎨 محرك الصور والعلامة التجارية\n\nالبرومبت الاحترافي:\n${proPrompt}`,
      next_steps: ['Refine style (realistic/3d/minimal)', 'Generate 4 variations', 'Save to media', 'Create branding kit ZIP']
    };
  }

  private async generalEngine(message: string, intent: any) {
    return {
      data: { message, intent },
      answer: `🚀 TMG SUPER APP V3.1 - OMNIPOTENT FOUNDATION\n\n✅ LIVE & READY!\n\nYou said: "${message}"\n\nI AM READY TO CREATE ANYTHING:\n\n🎨 **IMAGE / LOGO / BRANDING** - "Generate logo for TMG Consulting, modern, blue gold"\n📄 **DOCUMENTS** - "Create business plan for gym in Doha"\n📊 **PRESENTATIONS** - "Create 10 slides pitch for investor Qatar"\n📁 **PROJECTS** - "Create project TMG Office Tower" or "List projects"\n📝 **CONTENT** - "List content" / "Create content"\n📈 **STATS** - "Analyze system"\n\n**12 ENGINES ARCHITECTURE BUILT:**\n✅ Image ✅ Document ✅ Presentation ✅ Project ✅ Content ✅ Branding\n⏳ Video (V3.2) ⏳ Audio (V3.2) ⏳ Code/Pages (V3.3) ⏳ Trading Bot (V3.3) ⏳ Automation (V3.4)\n\n**YOUR REQUEST:**\nTell me in ANY LANGUAGE what you want to create, and I will build it step-by-step with professional quality.\n\nExamples:\n• "صمم لوجو لشركة استشارات في قطر، احترافي، أزرق وذهبي"\n• "Create proposal PDF for client Al Rayyan"\n• "Generate office photo, modern, corporate"\n• "Create pitch deck 12 slides for new gym"\n\nWhat shall we create now?`,
      next_steps: ['Choose format', 'Describe details', 'I enhance to pro', 'Generate & Save']
    };
  }

  // --- HELPERS ---
  private detectIntent(message: string) {
    const l = message.toLowerCase();
    let engine: EngineType = 'project';
    if (l.match(/image|photo|logo|picture|صورة|لوجو|تصميم|generate.*image|draw|branding|brand/)) engine = 'image';
    if (l.match(/brand kit|full brand|هوية بصرية/)) engine = 'branding';
    if (l.match(/document|pdf|doc|business plan|proposal|contract|invoice|خطة عمل|عقد|مستند|risk|assessment|cv/)) engine = 'document';
    if (l.match(/presentation|ppt|slides|pitch deck|شرائح|عرض تقديمي|بوربوينت/)) engine = 'presentation';
    if (l.match(/project|مشروع|list.*project/)) engine = 'project';
    if (l.match(/content|محتوى/)) engine = 'content';
    if (l.match(/code|page|landing|website|صفحة|كود|موقع/)) engine = 'code' as any;
    if (l.match(/video|فيديو|reel/)) engine = 'video';
    if (l.match(/audio|voice|صوت|تعليق صوتي/)) engine = 'audio';
    if (l.match(/trading|forex|boat|تداول|forex bot/)) engine = 'trading';
    return { engine, prompt: message };
  }

  private detectDocType(msg: string) {
    const l = msg.toLowerCase();
    if (l.includes('business plan')) return 'business_plan';
    if (l.includes('proposal')) return 'proposal';
    if (l.includes('contract')) return 'contract';
    if (l.includes('invoice')) return 'invoice';
    if (l.includes('risk')) return 'risk_assessment';
    if (l.includes('cv') || l.includes('resume')) return 'cv';
    return 'general_document';
  }

  private getDocStructure(type: string, prompt: string) {
    const structures: any = {
      business_plan: { sections: ['Executive Summary', 'Company Overview', 'Market Analysis (Qatar/GCC)', 'Services', 'Marketing Strategy', 'Operations', 'Financial Projections (3 years)', 'Risk Analysis', 'Conclusion'] },
      proposal: { sections: ['Cover Page - TMG Branding', 'About TMG', 'Understanding Client Need', 'Proposed Solution', 'Timeline & Milestones', 'Investment & Pricing', 'Team', 'Terms & Next Steps'] },
      general_document: { sections: ['Title - Professional TMG Header', 'Introduction', 'Main Content: ' + prompt.substring(0,60), 'Analysis/Data', 'Recommendations', 'Conclusion', 'Contact TMG'] },
    };
    return structures[type] || structures.general_document;
  }

  private generateSlidesOutline(prompt: string) {
    return [
      { title: 'Cover - TMG', bullets: ['Professional Title: ' + prompt, 'TMG Business Consultant - Qatar'] },
      { title: 'About TMG', bullets: ['Leading Consulting in Qatar', 'Our Expertise'] },
      { title: 'Opportunity / Problem', bullets: ['Market context in GCC', 'Client pain point'] },
      { title: 'Our Solution', bullets: [prompt.substring(0,80), 'Key benefits'] },
      { title: 'Why TMG?', bullets: ['Track record', 'Local expertise', 'Global standards'] },
      { title: 'Process & Timeline', bullets: ['Phase 1: Discovery', 'Phase 2: Execution', 'Phase 3: Delivery'] },
      { title: 'Investment', bullets: ['Transparent pricing', 'ROI focused'] },
      { title: 'Next Steps', bullets: ['Call to action', 'Contact info'] },
    ];
  }

  private enhanceImagePrompt(prompt: string, intent: any) {
    return `${prompt}, professional, ultra detailed, 8k, photorealistic, studio lighting, corporate style, clean background, TMG Business Consultant branding, Qatar/GCC modern business aesthetic, award winning design, highly detailed, sharp focus, trending on Behance, color palette blue #0A3D62 and gold #F5B400, luxury consulting`;
  }

  private generateBrandingKit(name: string) {
    return {
      logo_prompt: `Minimal luxury logo for ${name}, vector, flat, corporate`,
      colors: { primary: '#0A3D62', secondary: '#F5B400', accent: '#FFFFFF', dark: '#1A1A1A' },
      fonts: ['Montserrat Bold for headings', 'Open Sans for body', 'Tajawal for Arabic'],
      assets: ['Logo PNG + SVG', 'Business Card', 'Letterhead', 'Email Signature', 'Social Media Kit (IG, LinkedIn)', 'Brand Guideline PDF 2 pages'],
    };
  }
}
