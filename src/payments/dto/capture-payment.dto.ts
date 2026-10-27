import { IsString } from 'class-validator';

export type PaymentPlanId = string;

export class CapturePaymentDto {
  @IsString()
  orderID!: string;

  @IsString()
  planId!: PaymentPlanId;
}
