import { IsIn, IsString } from 'class-validator';
import type { PaymentPlanId } from './capture-payment.dto';

export class CreatePaymentOrderDto {
  @IsString()
  @IsIn(['starter', 'pro', 'business'])
  planId: PaymentPlanId;
}
