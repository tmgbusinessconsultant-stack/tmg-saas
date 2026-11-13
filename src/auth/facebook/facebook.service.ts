import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import * as crypto from 'crypto';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FacebookService {
  constructor(
    @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  getLoginUrl(): string {
    const appId = process.env.FACEBOOK_APP_ID;
    const redirect = process.env.FACEBOOK_CALLBACK_URL;
    if (!appId || !redirect) {
      throw new BadRequestException('Facebook is not configured. Missing FACEBOOK_APP_ID or FACEBOOK_CALLBACK_URL');
    }
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirect,
      scope: 'email',
      response_type: 'code',
    });
    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  }

  async handleCallback(code: string) {
    if (!code) throw new BadRequestException('Missing Facebook code');
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const redirect = process.env.FACEBOOK_CALLBACK_URL;
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
        new URLSearchParams({
          client_id: appId!,
          client_secret: appSecret!,
          redirect_uri: redirect!,
          code,
        }).toString(),
    );
    const tokenData: any = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new BadRequestException(`Facebook token error: ${tokenData.error?.message || 'No access token'}`);
    }
    const meRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name,email,picture.type(large)&access_token=${tokenData.access_token}`,
    );
    const profile: any = await meRes.json();
    if (!profile.email) {
      throw new BadRequestException('Facebook did not return an email. User must allow email permission.');
    }
    const auth = await this.authService.loginWithSocial({
      email: profile.email,
      name: profile.name || profile.email.split('@')[0],
      provider: 'facebook',
      providerId: profile.id,
    });
    return auth;
  }

  frontendBase(): string {
    return (process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
  }

  async deauthorize(signedRequest?: string) {
    const base = { url: `${this.frontendBase()}/data-deletion`, confirmation_code: 'tmg-deauthorize-received' };
    try {
      if (!signedRequest) return base;
      const [encodedSig, encodedPayload] = signedRequest.split('.');
      if (!encodedSig || !encodedPayload) return base;
      const expected = crypto.createHmac('sha256', process.env.FACEBOOK_APP_SECRET!).update(encodedPayload).digest('base64url');
      if (expected !== encodedSig) return base;
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
      const fbId = String(payload.user_id);
      if (!fbId) return base;
      const link = await this.prisma.socialAccount.findUnique({
        where: { provider_providerId: { provider: 'facebook', providerId: fbId } },
      });
      if (!link) return { ...base, confirmation_code: `tmg-no-user-${fbId}` };
      await this.prisma.user.delete({ where: { id: link.userId } });
      console.log(`[Facebook Deauthorize] Deleted user ${link.userId} fbId=${fbId}`);
      return { url: `${this.frontendBase()}/data-deletion`, confirmation_code: `tmg-deleted-${fbId}-${Date.now()}` };
    } catch (e: any) {
      console.error('[Facebook Deauthorize] Error:', e.message);
      return base;
    }
  }
}
