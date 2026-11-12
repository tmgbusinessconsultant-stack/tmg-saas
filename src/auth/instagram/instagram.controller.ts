import { Controller, Get, Query, Res } from '@nestjs/common';
import { InstagramService } from './instagram.service';
import { Public } from '../public.decorator';

@Controller('auth/instagram')
export class InstagramController {
  constructor(private readonly ig: InstagramService) {}
  @Public() @Get('login') login(@Res() res: any) { return res.redirect(this.ig.getLoginUrl()); }
  @Public() @Get('callback') async callback(@Query('code') code: string, @Query('error') error: string, @Res() res: any) {
    if (error) return res.redirect(`${this.ig.frontendBase()}/login?error=instagram_denied`);
    try {
      const auth = await this.ig.handleCallback(code);
      const token = encodeURIComponent(auth.accessToken);
      const user = encodeURIComponent(JSON.stringify(auth.user));
      return res.redirect(`${this.ig.frontendBase()}/auth/callback?token=${token}&user=${user}`);
    } catch (e: any) { return res.redirect(`${this.ig.frontendBase()}/login?error=${encodeURIComponent(e.message || 'instagram_failed')}`); }
  }
}
