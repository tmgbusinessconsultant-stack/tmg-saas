import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  HttpException,
  Logger
} from '@nestjs/common';
import { SuperAppService } from './superapp.service';
import { Public } from '../auth/public.decorator';

/**
 * GLOBAL DTO - Accepts ALL frontend fields
 */
export class SuperAppChatDto {
  message?: string;
  prompt?: string;
  query?: string;
  language?: string;
  engine?: string;
  context?: string;
  type?: string;
  mode?: string;
  history?: any[];
  metadata?: any;
}

@Controller('admin/superapp')
export class SuperAppController {
  private readonly logger = new Logger(SuperAppController.name);

  constructor(private readonly superAppService: SuperAppService) { }

  @Public()
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Body() body: SuperAppChatDto) {
    // FIX: Accept prompt OR message OR query (global)
    const finalMessage = body.message || body.prompt || body.query || "";
    const { language = 'auto', history = [] } = body;

    if (!finalMessage || typeof finalMessage !== 'string' || !finalMessage.trim()) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Missing Execution Parameter',
          message: 'Provide message, prompt, or query',
          received: body, // debug help
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      this.logger.log(`Routing to SuperApp Engine [Lang: ${language}] [Engine: ${body.engine || 'auto'}] Prompt: ${finalMessage.slice(0, 80)}`);
      return await this.superAppService.chat(finalMessage, language, history);
    } catch (error: any) {
      this.logger.error(`Pipeline failure: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Orchestration Fault',
          message: 'AI pipeline fatal error',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Public()
  @Get('gallery')
  @HttpCode(HttpStatus.OK)
  async gallery() {
    try {
      return await this.superAppService.chat('show gallery', 'en', []);
    } catch (error: any) {
      throw new HttpException('Internal Repository Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Public()
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: 'V7.0-ENTERPRISE-GLOBAL-FIX',
      engines: 12,
      pipelineReady: true,
      accepts: ['message', 'prompt', 'query', 'engine', 'context', 'type'],
    };
  }
}