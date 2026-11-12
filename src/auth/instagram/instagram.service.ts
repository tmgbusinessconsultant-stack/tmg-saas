import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class InstagramService {
  constructor(@Inject(forwardRef(() => AuthService)) private readonly authService: AuthService) {}

  getLoginUrl(): string {
    const appId = process.env.FACEBOOK_APP_ID;
    const redirect = process.env.INSTAGRAM_CALLBACK_URL || process.env.FACEBOOK_CALLBACK_URL?.replace("facebook","instagram");
    if (!appId || !redirect) throw new BadRequestException('Instagram not configured');
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirect,
      scope: 'instagram_basic,instagram_business_basic,email',
      response_type: 'code',
    });
    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  }

  async handleCallback(code: string) {
    if (!code) throw new BadRequestException('Missing Instagram code');
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const redirect = process.env.INSTAGRAM_CALLBACK_URL || process.env.FACEBOOK_CALLBACK_URL?.replace("facebook","instagram");
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?` + new URLSearchParams({ client_id: appId!, client_secret: appSecret!, redirect_uri: redirect!, code }).toString());
    const tokenData: any = await tokenRes.json();
    if (!tokenData.access_token) throw new BadRequestException(`Instagram token error: ${tokenData.error?.message || 'No token'}`);
    const meRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,email,username&access_token=${tokenData.access_token}`);
    const profile: any = await meRes.json();
    if (!profile.email) throw new BadRequestException('Instagram did not return email. User must allow email. Use a Business account with email.');
    return this.authService.loginWithSocial({ email: profile.email, name: profile.name || profile.username || profile.email.split('@')[0], provider: 'instagram', providerId: profile.id });
  }

  frontendBase(): string {
    return (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
  }
}

