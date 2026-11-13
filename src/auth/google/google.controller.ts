import { Controller, Get, Query, Res } from '@nestjs/common';
import { GoogleService } from './google.service';
import { Public } from '../public.decorator';

@Controller('auth/google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Public()
  @Get('login')
  login(@Res() res: any) {
    return res.redirect(this.googleService.getLoginUrl());
  }

  @Public()
  @Get('callback')
  async callback(@Query('code') code: string, @Query('error') error: string, @Res() res: any) {
    if (error) {
      return res.redirect(`${this.googleService.frontendBase()}/login?error=google_denied`);
    }
    try {
      const auth = await this.googleService.handleCallback(code);
      const frontend = this.googleService.frontendBase();
      const token = encodeURIComponent(auth.accessToken);
      const user = encodeURIComponent(JSON.stringify(auth.user));
      return res.redirect(`${frontend}/auth/callback?token=${token}&user=${user}`);
    } catch (e: any) {
      return res.redirect(`${this.googleService.frontendBase()}/login?error=${encodeURIComponent(e.message || 'google_failed')}`);
    }
  }
}
