import { Injectable } from '@nestjs/common';
@Injectable()
export class WhatsappService {
  getStatus() { return { service: 'WhatsApp', configured: !!process.env.WHATSAPP_ACCESS_TOKEN, phoneId: process.env.WHATSAPP_PHONE_NUMBER_ID ? 'SET' : 'MISSING' }; }
  async sendMessage(to: string, message: string) {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;
    const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', to: to, type: 'text', text: { body: message } }) });
    return await res.json();
  }
  verifyWebhook(mode: string, token: string, challenge: string) { if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) return challenge; return 'Verification failed'; }
  async handleIncoming(body: any) {
    try {
      const msg = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (!msg) return { ok: true };
      const from = msg.from; const text = msg.text?.body || '';
      console.log('WHATSAPP IN:', from, text);
      await this.sendMessage(from, `Hello from TMG! You said: ${text}`);
      return { ok: true };
    } catch (e) { console.log(e); return { ok: true }; }
  }
}
