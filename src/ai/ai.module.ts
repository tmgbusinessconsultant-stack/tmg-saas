import { Module, Logger } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';
import { UserPlansModule } from '../user-plans/user-plans.module';
import { PlansModule } from '../plans/plans.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { FileAnalysisService } from './file-analysis.service';
import { KnowledgeService } from './knowledge.service';
import { TurnstileService } from './turnstile.service';

@Module({
  imports: [
    PrismaModule,
    // Upgraded connection engine parameters to comfortably handle high-fidelity multi-engine operations
    HttpModule.register({
      timeout: 25000,        // Raised to 25 seconds to support background rendering pipelines without timing out
      maxRedirects: 3,        // Restricts network loops during external API queries
    }),
    UserPlansModule,
    PlansModule,
  ],
  controllers: [AiController],
  providers: [
    AiService,
    FileAnalysisService,
    KnowledgeService,
    TurnstileService,
    // Inject structural application tracking context across core background workers
    {
      provide: Logger,
      useValue: new Logger('AiModuleContext'),
    },
  ],
  exports: [
    AiService,
    TurnstileService,
    FileAnalysisService,
    KnowledgeService,
    HttpModule, // Export network config loop so adjacent feature modules can share optimized connection timeouts
  ],
})
export class AiModule { }
