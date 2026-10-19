import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CvDocumentsController } from './cv-documents.controller';
import { CvDocumentsService } from './cv-documents.service';

@Module({
  imports: [PrismaModule],
  controllers: [CvDocumentsController],
  providers: [CvDocumentsService],
})
export class CvDocumentsModule {}
