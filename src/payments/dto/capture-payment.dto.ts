import { IsIn, IsString, Matches } from 'class-validator';

export type PaymentPlanId = 'starter' | 'pro' | 'business';

export class CapturePaymentDto {
  @IsString()
  @Matches(/^[A-Z0-9-]{10,64}$/)
  orderID: string;

  @IsString()
  @IsIn(['starter', 'pro', 'business'])
  planId: PaymentPlanId;
}
