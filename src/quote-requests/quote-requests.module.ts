import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { TurnstileService } from '../common/turnstile/turnstile.service'; // or '../ai/turnstile.service' if your file is there
import { QuoteRequestsController } from './quote-requests.controller';
import { QuoteRequestsService } from './quote-requests.service';

@Module({
  imports: [AiModule],
  controllers: [QuoteRequestsController],
  providers: [QuoteRequestsService, TurnstileService],
})
export class QuoteRequestsModule { }