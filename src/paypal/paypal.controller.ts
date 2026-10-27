import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { PaypalService } from './paypal.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';

@Controller('paypal')
export class PaypalController {
  constructor(private readonly paypalService: PaypalService) {}

  @Public()
  @Get('webhook')
  health() { return { status: 'TMG PayPal Webhook LIVE', time: new Date().toISOString() }; }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  async verify(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) throw new Error('Not authenticated');
    return this.paypalService.verifyAndActivate(body, userId);
  }

  @Public()
  @Post('webhook')
  async handleWebhook(@Body() event: any) {
    return this.paypalService.handleWebhookEvent(event);
  }
}
