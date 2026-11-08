import { Injectable, Logger } from "@nestjs/common";
@Injectable()
export class NotificationsService {
  private readonly log = new Logger("AdminAlert");
  async notifyAdmin(title: string, body: string) {
    const text = `${title}\n${body}\nTime: ${new Date().toISOString()}`;
    // 1. WhatsApp Cloud API - only if configured
    try {
      const token = process.env.WHATSAPP_TOKEN, phoneId = process.env.WHATSAPP_PHONE_ID, to = process.env.ADMIN_WHATSAPP || "97470454450";
      if (token && phoneId) {
        await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text.slice(0, 4000) } }) });
      }
    } catch {}
    // 2. Email via Resend - only if configured
    try {
      const key = process.env.RESEND_API_KEY, toEmail = process.env.ADMIN_EMAIL;
      if (key && toEmail) {
        await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.RESEND_FROM || "TMG <alerts@tmgbusinessconsulting.com>", to: [toEmail], subject: title, text }) });
      }
    } catch {}
    // 3. Always log - never silent, never throws
    this.log.warn(`\n========== ADMIN ALERT ==========\n${text}\n==================================`);
  }
}
