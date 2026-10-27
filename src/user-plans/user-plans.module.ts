import { Module } from '@nestjs/common';
import { UserPlansService } from './user-plans.service';
import { UserPlansController } from './user-plans.controller';
import { PlanGuard } from './plan.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [PrismaModule, PlansModule],
  controllers: [UserPlansController],
  providers: [UserPlansService, PlanGuard],
  exports: [UserPlansService, PlanGuard],
})
export class UserPlansModule {}
