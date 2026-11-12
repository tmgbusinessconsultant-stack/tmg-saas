import { Controller, Get, Query, Res } from '@nestjs/common';
import { LinkedinService } from './linkedin.service';
@Controller('auth/linkedin')
export class LinkedinController {
  constructor(private readonly li: LinkedinService) {}
  @Get('status') status() { return this.li.getStatus(); }
  @Get('login') login(@Res() res: any) { return res.redirect(this.li.getLoginUrl()); }
  @Get('callback') async callback(@Query('code') code: string) { return this.li.handleCallback(code); }
}
