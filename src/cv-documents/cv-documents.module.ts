import { Module } from '@nestjs/common';
import { CvDocumentsController } from './cv-documents.controller';
import { CvDocumentsService } from './cv-documents.service';
import { UserPlansModule } from '../user-plans/user-plans.module';
import { PlansModule } from '../plans/plans.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    UserPlansModule,
    PlansModule
  ],
  controllers: [CvDocumentsController],
  providers: [CvDocumentsService],
  exports: [CvDocumentsService],
})
export class CvDocumentsModule { }
