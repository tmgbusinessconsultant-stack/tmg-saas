import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleService {
  constructor(@Inject(forwardRef(() => AuthService)) private readonly authService: AuthService) {}

  getLoginUrl(): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirect = process.env.GOOGLE_CALLBACK_URL;
    if (!clientId || !redirect) {
      throw new BadRequestException('Google is not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CALLBACK_URL');
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirect,
      scope: 'openid email profile',
      response_type: 'code',
      access_type: 'offline',
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleCallback(code: string) {
    if (!code) throw new BadRequestException('Missing Google code');
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirect = process.env.GOOGLE_CALLBACK_URL;
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId!, client_secret: clientSecret!, redirect_uri: redirect!, code, grant_type: 'authorization_code' }).toString(),
    });
    const tokenData: any = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new BadRequestException(`Google token error: ${tokenData.error_description || tokenData.error || 'No access token'}`);
    }
    const meRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
    const profile: any = await meRes.json();
    if (!profile.email) {
      throw new BadRequestException('Google did not return an email.');
    }
    return this.authService.loginWithSocial({
      email: profile.email,
      name: profile.name || profile.email.split('@')[0],
      provider: 'google',
      providerId: profile.sub,
    });
  }

  frontendBase(): string {
    return (process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
  }
}
