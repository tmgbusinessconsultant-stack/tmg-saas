import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { FileAnalysisService } from './file-analysis.service';
import { KnowledgeService } from './knowledge.service';
import { TurnstileService } from './turnstile.service';

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [AiService, FileAnalysisService, KnowledgeService, TurnstileService],
  exports: [AiService, TurnstileService, FileAnalysisService, KnowledgeService],
})
export class AiModule {}
