import { Controller, Get, Param } from '@nestjs/common';
import { PlansService } from './plans.service';

@Controller('plans')
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  findAll() {
    return this.plans.getAllPlans();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plans.getPlan(id);
  }
}
