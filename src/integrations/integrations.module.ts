import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { YoutubeController } from './youtube.controller';
import { TiktokController } from './tiktok.controller';

@Module({
  imports: [PrismaModule],
  controllers: [IntegrationsController, YoutubeController, TiktokController],
  providers: [IntegrationsService],
})
export class IntegrationsModule {}
