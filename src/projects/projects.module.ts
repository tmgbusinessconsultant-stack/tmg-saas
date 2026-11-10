import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { StorageModule } from '../common/storage/storage.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, StorageModule, MailModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
