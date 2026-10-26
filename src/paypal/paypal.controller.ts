import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { PaypalService } from './paypal.service';

@Controller('paypal')
export class PaypalController {
  constructor(private readonly paypalService: PaypalService) {}

  @Get('webhook')
  health() { return { status: 'TMG PayPal Webhook LIVE' }; }

  @Post('verify')
  async verify(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) throw new Error('User not authenticated - login first');
    return this.paypalService.verifyAndActivate(body, userId);
  }

  @Post('webhook')
  async handleWebhook(@Body() event: any) {
    await this.paypalService.handleWebhookEvent(event);
    return { received: true };
  }
}