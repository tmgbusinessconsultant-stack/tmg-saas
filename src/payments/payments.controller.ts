import { Body, Controller, Get, Post } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { Permissions } from '../auth/permissions.decorator';
import { CapturePaymentDto } from './dto/capture-payment.dto';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Public()
  @Post('orders')
  createOrder(@Body() dto: CreatePaymentOrderDto) {
    return this.service.createOrder(dto.planId);
  }

  @Public()
  @Post('capture')
  capture(@Body() dto: CapturePaymentDto) {
    return this.service.capture(dto);
  }

  @Permissions('finance:manage')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Permissions('finance:manage')
  @Get('stats')
  stats() {
    return this.service.revenueStats();
  }
}
