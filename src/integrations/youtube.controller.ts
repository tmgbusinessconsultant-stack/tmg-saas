import { Controller, Get, Query, Res, Post, Body } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../auth/public.decorator';

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID!;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET!;

function getRedirectUri(local: boolean) {
  if (local) return 'http://localhost:3000/auth/youtube/callback';
  return process.env.YOUTUBE_REDIRECT_URI || 'https://tmgbusinessconsulting.com/auth/youtube/callback';
}

@Controller('auth/youtube')
export class YoutubeController {
  @Public()
  @Get()
  start(@Res() res: Response, @Query('local') local?: string) {
    const redirectUri = getRedirectUri(local === '1');
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', CLIENT_ID);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.email');
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    url.searchParams.set('state', local === '1' ? 'local' : 'live');
    return res.redirect(url.toString());
  }

  @Public()
  @Post('exchange')
  async exchange(@Body() body: { code: string; local?: boolean }) {
    const redirectUri = getRedirectUri(!!body.local);
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: body.code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokens: any = await tokenRes.json();
    if (tokens.error) return tokens;
    return { access_token: tokens.access_token, refresh_token: tokens.refresh_token, expires_in: tokens.expires_in };
  }

  @Public()
  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const isLocal = state === 'local';
    const front = isLocal ? 'http://localhost:3000' : 'https://tmgbusinessconsulting.com';
    return res.redirect(`${front}/auth/youtube/callback?code=${encodeURIComponent(code)}&state=${state}`);
  }
}
