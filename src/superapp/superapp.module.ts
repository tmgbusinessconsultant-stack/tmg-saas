import { Module } from '@nestjs/common';
import { SuperAppService } from './superapp.service';
import { SuperAppController } from './superapp.controller';
import { ContentModule } from '../content/content.module';
import { ProjectsModule } from '../projects/projects.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [ContentModule, ProjectsModule, SettingsModule],
  controllers: [SuperAppController],
  providers: [SuperAppService],
})
export class SuperAppModule {}
