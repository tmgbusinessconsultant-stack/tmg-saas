import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.service';

@Controller()
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Public()
  @Post('public/track/view/:siteId')
  trackSite(@Param('siteId') siteId: string, @Body() body: any, @Req() req: any) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string);
    const ua = req.headers['user-agent'] as string;
    return this.analytics.trackSiteView(siteId, { ip, ua, referrer: body.referrer });
  }

  @Public()
  @Post('public/track/form-view/:formId')
  trackForm(@Param('formId') formId: string, @Body() body: any) {
    return this.analytics.trackFormView(formId, body.siteId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sites/:id/analytics')
  getStats(@Param('id') siteId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.analytics.getSiteStats(siteId, user);
  }
}
