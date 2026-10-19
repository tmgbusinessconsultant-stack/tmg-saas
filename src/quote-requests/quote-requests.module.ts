import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { QuoteRequestsController } from './quote-requests.controller';
import { QuoteRequestsService } from './quote-requests.service';

@Module({
  imports: [AiModule],
  controllers: [QuoteRequestsController],
  providers: [QuoteRequestsService],
})
export class QuoteRequestsModule {}
