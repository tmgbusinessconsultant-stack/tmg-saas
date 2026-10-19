import { Module } from '@nestjs/common';
import { StatsService } from '../modules/stats/stats.service';
import { StatsController } from './stats.controller';

@Module({
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
