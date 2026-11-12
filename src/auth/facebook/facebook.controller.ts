import { Controller, Get, Query, Res, Post, Body } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { Public } from '../public.decorator';

@Controller('auth/facebook')
export class FacebookController {
  constructor(private readonly fbService: FacebookService) {}

  @Public()
  @Get('login')
  login(@Res() res: any) {
    return res.redirect(this.fbService.getLoginUrl());
  }

  @Public()
  @Get('callback')
  async callback(@Query('code') code: string, @Query('error') error: string, @Res() res: any) {
    if (error) {
      return res.redirect(`${this.fbService.frontendBase()}/login?error=facebook_denied`);
    }
    try {
      const auth = await this.fbService.handleCallback(code);
      const frontend = this.fbService.frontendBase();
      const token = encodeURIComponent(auth.accessToken);
      const user = encodeURIComponent(JSON.stringify(auth.user));
      return res.redirect(`${frontend}/auth/callback?token=${token}&user=${user}`);
    } catch (e: any) {
      return res.redirect(`${this.fbService.frontendBase()}/login?error=${encodeURIComponent(e.message || 'facebook_failed')}`);
    }
  }

  @Public()
  @Post('deauthorize')
  async deauthorize(@Body() body: any) {
    return { url: `${this.fbService.frontendBase()}/privacy`, confirmation_code: 'tmg-deauthorize-received' };
  }
}
