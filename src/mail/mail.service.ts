import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

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

  async send(to: string, subject: string, text: string, html?: string): Promise<void> {
    const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@tmgbusinessconsulting.com';
    if (!this.transporter) {
      this.logger.warn(`Mail transport not configured. To=${to} Subject=${subject}`);
      this.logger.debug(text);
      return;
    }
    await this.transporter.sendMail({ from, to, subject, text, html: html ?? `<pre>${text}</pre>` });
  }
}
