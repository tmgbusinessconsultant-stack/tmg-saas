import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SuperAppService } from './superapp.service';
import { SuperAppController } from './superapp.controller';

@Module({
  imports: [HttpModule],
  controllers: [SuperAppController],
  providers: [SuperAppService],
  exports: [SuperAppService],
})
export class SuperAppModule {}
