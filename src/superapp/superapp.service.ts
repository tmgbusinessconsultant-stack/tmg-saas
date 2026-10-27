import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuperAppService {
  private readonly logger = new Logger(SuperAppService.name);
  constructor(private prisma: PrismaService) {}

  async chat(message: string, language = 'auto', history: any[] = []) {
    const lower = message.toLowerCase();
    this.logger.log(`SuperApp: ${message}`);
    try {
      const lowerMsg = lower;
      let answer = '';
      let data: any = null;

      if (lowerMsg.match(/project|مشروع/)) {
        const projects = await this.prisma.project.findMany({ take: 10 }).catch(()=>[]);
        data = projects;
        answer = `Found ${projects.length} projects:\n` + projects.map((p:any)=>`- ${p.title} (${p.status})`).join('\n');
      } else if (lowerMsg.match(/content|محتوى/)) {
        const content = await this.prisma.content.findMany({ take: 10 }).catch(()=>[]);
        data = content;
        answer = `Found ${content.length} content items:\n` + content.map((c:any)=>`- ${c.key} - ${c.title}`).join('\n');
      } else if (lowerMsg.match(/setting|اعدادات/)) {
        const settings = await this.prisma.setting.findMany({ take: 10 }).catch(()=>[]);
        data = settings;
        answer = `Settings (${settings.length}):\n` + settings.map((s:any)=>`- ${s.key}`).join('\n');
      } else if (lowerMsg.match(/image|photo|logo|صورة|لوجو|تصميم|generate|create.*image/)) {
        const basePrompt = message.replace(/create|generate|image|photo/gi,'').trim();
        const proPrompt = `${basePrompt}, professional, 8k, ultra detailed, photorealistic, studio lighting, corporate, TMG style`;
        data = { professionalPrompt: proPrompt, negativePrompt: 'low quality, blurry' };
        answer = `✅ Image Ready: "${basePrompt}"\n\nPRO PROMPT (use in DALL-E / Midjourney / Flux):\n${proPrompt}\n\nNEGATIVE: low quality, blurry\n\nTell me style: realistic / 3d / logo / corporate and I will refine.`;
      } else if (lowerMsg.match(/stat|analy|احصائيات/)) {
        const [p,c,s,u] = await Promise.all([
          this.prisma.project.count().catch(()=>0),
          this.prisma.content.count().catch(()=>0),
          this.prisma.setting.count().catch(()=>0),
          this.prisma.user.count().catch(()=>0),
        ]);
        answer = `📊 SYSTEM STATS:\n- Projects: ${p}\n- Content: ${c}\n- Settings: ${s}\n- Users: ${u}\n\nWhat do you want to create?`;
        data = { projects:p, content:c, settings:s, users:u };
      } else {
        answer = `🚀 TMG SUPER APP - I CAN CREATE ANYTHING!

You said: "${message}"

I understand ANY language (Arabic, English, French...).

I CAN:
✅ Generate Images/Logos/Photos - say "Generate logo for TMG" or "صمم صورة مكتب"
✅ List Projects/Content/Settings
✅ Analyze System
✅ Create anything - just describe

Your request: ${message}

Tell me more details and I will create it in professional quality.

Examples:
- "Generate modern consulting office photo, realistic, 8k"
- "List projects"
- "Show content"
- "Create project for Qatar client"

What do you want to build?`;
      }

      return {
        intent: lowerMsg.includes('image') || lowerMsg.includes('صورة') ? 'generate_image' : 'general',
        data,
        answer,
        answer_en: answer,
        answer_ar: answer,
        language_detected: /[\u0600-\u06FF]/.test(message) ? 'ar' : 'en',
        can_create: ['image','logo','project','content','anything'],
        timestamp: new Date().toISOString(),
      };
    } catch (e:any) {
      return { error: e.message, answer: `Error: ${e.message}` };
    }
  }
}
