import { Controller, Get } from '@nestjs/common';
import { Permissions } from '../auth/permissions.decorator';
import { StatsService } from '../modules/stats/stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Permissions('finance:manage')
  @Get() async get() {
    return this.statsService.getStats();
  }
}
