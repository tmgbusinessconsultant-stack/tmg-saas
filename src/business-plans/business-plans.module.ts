import { Module } from '@nestjs/common';
import { BusinessPlansController } from './business-plans.controller';
import { BusinessPlansService } from './business-plans.service';
import { UserPlansModule } from '../user-plans/user-plans.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [UserPlansModule, PlansModule],
  controllers: [BusinessPlansController],
  providers: [BusinessPlansService],
})
export class BusinessPlansModule {}
