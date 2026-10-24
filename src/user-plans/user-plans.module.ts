import { Module } from '@nestjs/common';
import { UserPlansService } from './user-plans.service';
import { PlanGuard } from './plan.guard';
import { UserPlansController } from './user-plans.controller';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [PlansModule],
  controllers: [UserPlansController],
  providers: [UserPlansService, PlanGuard],
  exports: [UserPlansService, PlanGuard],
})
export class UserPlansModule {}
