import { Module } from '@nestjs/common';
import { PaypalController } from './paypal.controller';
import { PaypalService } from './paypal.service';
import { UserPlansModule } from '../user-plans/user-plans.module';

@Module({
  imports: [UserPlansModule],
  controllers: [PaypalController],
  providers: [PaypalService],
})
export class PaypalModule {}