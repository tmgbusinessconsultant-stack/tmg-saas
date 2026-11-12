import { Controller, Get } from '@nestjs/common';

@Controller()
export class PrivacyController {
  @Get('privacy-policy')
  getPrivacy() {
    return {
      title: 'Privacy Policy - TMG Business Consulting',
      updated: 'November 11, 2026',
      contact: 'info@tmgbusinessconsulting.com',
      text: 'TMG Business Consulting helps businesses in Qatar grow with AI, training and consulting. When you contact us via Facebook, WhatsApp or website, we collect name, phone, email and messages only to reply to you. We do not sell your data. For questions: info@tmgbusinessconsulting.com',
    };
  }

  @Get('terms')
  getTerms() {
    return { title: 'Terms - TMG Business Consulting', text: 'By using TMG services you agree to our terms. Contact: info@tmgbusinessconsulting.com' };
  }
}
