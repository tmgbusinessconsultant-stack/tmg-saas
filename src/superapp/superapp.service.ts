import { Injectable, Logger } from '@nestjs/common';
import { ContentService } from '../content/content.service';
import { ProjectsService } from '../projects/projects.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class SuperAppService {
  private readonly logger = new Logger(SuperAppService.name);

  constructor(
    private content: ContentService,
    private projects: ProjectsService,
    private settings: SettingsService,
  ) {}

  async detectAndTranslate(text: string, targetLang: string = 'en'): Promise<{ detected: string, translated: string }> {
    try {
      if (!text) return { detected: 'en', translated: '' };
      const detected = /[\u0600-\u06FF]/.test(text) ? 'ar' : 'en';
      if (detected === targetLang) return { detected, translated: text };
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${detected}|${targetLang}`);
      const data = await res.json() as any;
      return { detected, translated: data?.responseData?.translatedText || text };
    } catch {
      return { detected: 'en', translated: text };
    }
  }

  async translateBack(text: string, toLang: string): Promise<string> {
    if (!toLang || toLang === 'en' || toLang === 'auto') return text;
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${toLang}`);
      const data = await res.json() as any;
      return data?.responseData?.translatedText || text;
    } catch { return text; }
  }

  async chat(message: string, userLang: string = 'en', history: any[] = []) {
    const { detected, translated } = await this.detectAndTranslate(message, 'en');
    const finalUserLang = userLang !== 'en' && userLang !== 'auto' ? userLang : detected;
    this.logger.log(`UserLang: ${finalUserLang} Detected: ${detected} -> EN: ${translated}`);

    let toolResult: any = null;
    let answerEn = '';

    const lower = translated.toLowerCase();
    try {
      if (lower.includes('homepage') || lower.includes('hero') || lower.includes('home')) {
        toolResult = await this.content.getPublicHomepage();
        answerEn = `Current homepage loaded. Hero: ${JSON.stringify(toolResult).slice(0, 600)}... Tell me what to change.`;
      } else if (lower.includes('project')) {
        try { toolResult = await this.projects.findAll({} as any); } catch { toolResult = await this.projects.findAllStaff(); }
        answerEn = `Found ${Array.isArray(toolResult) ? toolResult.length : 'some'} projects. ${JSON.stringify(toolResult).slice(0, 800)}`;
      } else if (lower.includes('setting')) {
        toolResult = await this.settings.getPublicSettings();
        answerEn = `Settings: ${JSON.stringify(toolResult).slice(0, 800)}`;
      } else {
        answerEn = `I am TMG Super App (Admin). You said: "${translated}".\n\nI can:\n- get homepage\n- list projects\n- get settings\n- manage content\n\nTry: "Show homepage" or "List projects". Language: ${finalUserLang}`;

        if (process.env.OPENAI_API_KEY) {
          try {
            const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: 'You are TMG Super App, admin assistant for TMG Business Consulting. Helpful, concise, manages platform.' },
                  ...history.slice(-6),
                  { role: 'user', content: translated }
                ]
              })
            });
            const j = await openaiRes.json() as any;
            if (j.choices?.[0]?.message?.content) answerEn = j.choices[0].message.content;
          } catch (e) { this.logger.error(e); }
        }
      }
    } catch (e:any) {
      answerEn = `Tool error: ${e.message}`;
    }

    const finalAnswer = await this.translateBack(answerEn, finalUserLang);

    return {
      answer: finalAnswer,
      answer_en: answerEn,
      detected_language: finalUserLang,
      tool_used: toolResult ? 'yes' : 'no',
      tool_result: toolResult,
    };
  }
}
