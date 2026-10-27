import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // Built-in resilience engine for external Groq & Cloudflare calls
import { PrismaModule } from '../prisma/prisma.module';
import { UserPlansModule } from '../user-plans/user-plans.module'; // Enforces premium subscription authorization rules
import { PlansModule } from '../plans/plans.module'; // Resolves functional feature thresholds
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { FileAnalysisService } from './file-analysis.service';
import { KnowledgeService } from './knowledge.service';
import { TurnstileService } from './turnstile.service';

@Module({
  imports: [
    PrismaModule,
    HttpModule.register({
      timeout: 15000, // Safe 15-second cutoff to prevent request hanging on Render
      maxRedirects: 3,
    }),
    UserPlansModule,
    PlansModule,
  ],
  controllers: [AiController],
  providers: [
    AiService,
    FileAnalysisService,
    KnowledgeService,
    TurnstileService
  ],
  exports: [
    AiService,
    TurnstileService,
    FileAnalysisService,
    KnowledgeService
  ],
})
export class AiModule { }
