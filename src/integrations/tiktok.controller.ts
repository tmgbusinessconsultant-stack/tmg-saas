import { Controller, Get, Query, Res, Post, Body } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../auth/public.decorator';

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!;

function getRedirectUri(local: boolean) {
  if (local) return 'http://localhost:3000/auth/tiktok/callback';
  return process.env.TIKTOK_REDIRECT_URI || 'https://tmgbusinessconsulting.com/auth/tiktok/callback';
}

@Controller('auth/tiktok')
export class TiktokController {
  @Public()
  @Get()
  start(@Res() res: Response, @Query('local') local?: string) {
    const redirectUri = getRedirectUri(local === '1');
    const url = new URL('https://www.tiktok.com/v2/auth/authorize/');
    url.searchParams.set('client_key', CLIENT_KEY);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'user.info.basic,video.upload,video.publish');
    url.searchParams.set('state', local === '1' ? 'local' : 'live');
    return res.redirect(url.toString());
  }

  @Public()
  @Post('exchange')
  async exchange(@Body() body: { code: string; local?: boolean }) {
    const redirectUri = getRedirectUri(!!body.local);
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        code: body.code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });
    const tokens: any = await tokenRes.json();
    if (tokens.error) return tokens;
    return { access_token: tokens.access_token, refresh_token: tokens.refresh_token, expires_in: tokens.expires_in, open_id: tokens.open_id };
  }

  @Public()
  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const isLocal = state === 'local';
    const front = isLocal ? 'http://localhost:3000' : 'https://tmgbusinessconsulting.com';
    return res.redirect(`${front}/auth/tiktok/callback?code=${encodeURIComponent(code)}&state=${state}`);
  }
}
