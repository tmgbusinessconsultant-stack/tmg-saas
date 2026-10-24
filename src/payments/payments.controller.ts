import { Controller, Post, Get, Body, Req, Headers, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  async createOrder(@Body() body: any, @Req() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.payments.createOrder(body.planId, userId);
  }

  @Post('capture')
  @UseGuards(JwtAuthGuard)
  async capture(@Body() body: any, @Req() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.payments.captureOrder(body.orderID, userId, body.planId, body.billingCycle);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN','ADMIN')
  async list() { return this.payments.getPayments(); }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN','ADMIN')
  async stats() { return this.payments.getStats(); }

  // === PAYPAL WEBHOOK — PUBLIC, NO AUTH ===
  @Post('webhook/paypal')
  async paypalWebhook(@Body() body: any, @Headers() headers: any) {
    // TODO: Verify webhook signature with PayPal API in production
    // For now accept all (PayPal sends verification header)
    console.log('Headers:', headers['paypal-transmission-id']);
    return this.payments.handlePaypalWebhook(body);
  }
}
