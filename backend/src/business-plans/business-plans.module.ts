import { Module } from '@nestjs/common';
import { BusinessPlansController } from './business-plans.controller';
import { BusinessPlansService } from './business-plans.service';

@Module({
  controllers: [BusinessPlansController],
  providers: [BusinessPlansService],
  exports: [BusinessPlansService],
})
export class BusinessPlansModule {}
