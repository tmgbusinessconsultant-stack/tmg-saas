import { Controller, Post, Get, Body, Headers, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PaypalService } from '../paypal/paypal.service';
import { Public } from '../auth/public.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(
    private payments: PaymentsService,
    private paypalService: PaypalService,
  ) {}

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  async createOrder() {
    return this.payments.createOrder();
  }

  @Post('capture')
  @UseGuards(JwtAuthGuard)
  async capture() {
    return this.payments.captureOrder();
  }

  @Post('shop/orders')
  async createShopOrder() {
    return this.payments.createShopOrder();
  }

  @Post('shop/capture')
  async captureShopOrder() {
    return this.payments.captureShopOrder();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async list() { return this.payments.getPayments(); }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async stats() { return this.payments.getStats(); }

  @Post('webhook/paypal')
  @Public()
  async paypalWebhook(
    @Body() body: unknown,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return this.paypalService.handleWebhookEvent(body, headers);
  }
}
