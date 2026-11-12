import { Injectable } from '@nestjs/common';
@Injectable()
export class LinkedinService {
  getLoginUrl(): string {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirect = process.env.LINKEDIN_REDIRECT_URI;
    const scope = encodeURIComponent('openid profile email');
    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirect}&scope=${scope}`;
  }
  async handleCallback(code: string) { return { message: 'LinkedIn callback received', code }; }
  getStatus() { return { service: 'LinkedIn', configured: !!process.env.LINKEDIN_CLIENT_ID, profileUrl: process.env.LINKEDIN_URL || 'NOT SET' }; }
}
