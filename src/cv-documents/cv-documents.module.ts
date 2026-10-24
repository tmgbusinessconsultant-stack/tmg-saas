import { Module } from '@nestjs/common';
import { CvDocumentsController } from './cv-documents.controller';
import { CvDocumentsService } from './cv-documents.service';
import { UserPlansModule } from '../user-plans/user-plans.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [UserPlansModule, PlansModule],
  controllers: [CvDocumentsController],
  providers: [CvDocumentsService],
})
export class CvDocumentsModule {}
