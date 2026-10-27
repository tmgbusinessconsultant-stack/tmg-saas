import { IsString } from 'class-validator';
import { PaymentPlanId } from './capture-payment.dto';

export class CreatePaymentOrderDto {
  @IsString()
  planId!: PaymentPlanId;
}
