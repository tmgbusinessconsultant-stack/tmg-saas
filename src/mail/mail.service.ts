import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export type MailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
      });
    }
  }

  async send(to: string, subject: string, text: string, html?: string, attachments?: MailAttachment[]): Promise<void> {
    const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'TMG Business Consulting <info@tmgbusinessconsulting.com>';
    if (!this.transporter) {
      this.logger.warn(`Mail transport not configured. To=${to} Subject=${subject}${attachments?.length ? ` Attachments=${attachments.length}` : ''}`);
      this.logger.debug(text);
      return;
    }
    await this.transporter.sendMail({
      from,
      to,
      subject,
      text,
      html: html ?? `<pre>${text}</pre>`,
      attachments: attachments?.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
    });
  }

  getAdminNotificationEmail(): string {
    return (process.env.ADMIN_NOTIFICATION_EMAIL || 'info@tmgbusinessconsulting.com').trim();
  }
}
