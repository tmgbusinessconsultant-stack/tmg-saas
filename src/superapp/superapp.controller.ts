import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { SuperAppService } from './superapp.service';
import { Public } from '../auth/public.decorator';

@Controller('admin/superapp')
export class SuperAppController {
  private readonly logger = new Logger(SuperAppController.name);

  constructor(private readonly superAppService: SuperAppService) { }

  @Public()
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Body() body: any) {
    const finalMessage = body?.message || body?.prompt || body?.query || "";
    const language = body?.language || 'auto';
    const history = body?.history || body?.context || [];

    if (!finalMessage || typeof finalMessage !== 'string' || !finalMessage.trim()) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Missing Execution Parameter',
          message: 'Provide message, prompt, or query',
          received: body,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      this.logger.log(`SuperApp [${language}] [${body?.engine || 'auto'}] ${finalMessage.slice(0, 80)}`);
      return await this.superAppService.chat(finalMessage, language, history);
    } catch (error: any) {
      this.logger.error(`Pipeline failure: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'Orchestration Fault', message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Public()
  @Get('gallery')
  @HttpCode(HttpStatus.OK)
  async gallery() {
    return await this.superAppService.chat('show gallery', 'en', []);
  }

  @Public()
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: 'V7.0-ENTERPRISE-FIX-V2',
      engines: 12,
      pipelineReady: true,
    };
  }
}