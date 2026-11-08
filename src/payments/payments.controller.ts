import { Controller, Post, Get, Body, Headers, UseGuards, Req } from '@nestjs/common';
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
  async createOrder(@Body() body: any, @Req() req: any) { return this.payments.createOrder(body, req.user?.id); }

  @Post('capture')
  @UseGuards(JwtAuthGuard)
  async capture(@Body() body: any) { return this.payments.captureOrder(body); }

  @Post('shop/orders')
  @Public()
  async createShopOrder(@Body() body: any) { return this.payments.createShopOrder(body); }

  @Post('shop/capture')
  @Public()
  async captureShopOrder(@Body() body: any) { return this.payments.captureShopOrder(body); }

  @Post('securefind/orders')
  @Public()
  async createSecureFindOrder(@Body() body: any) { return this.payments.createSecureFindOrder(body); }

  @Post('securefind/capture')
  @Public()
  async captureSecureFindOrder(@Body() body: any) { return this.payments.captureSecureFindOrder(body); }
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
