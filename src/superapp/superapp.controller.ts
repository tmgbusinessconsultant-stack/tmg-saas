import { Controller, Post, Get, Body } from '@nestjs/common';
import { SuperAppService } from './superapp.service';
import { Public } from '../auth/public.decorator';

@Controller('admin/superapp')
export class SuperAppController {
  constructor(private readonly superAppService: SuperAppService) {}

  @Public()
  @Post('chat')
  async chat(@Body() body: { message: string; language?: string; history?: any[] }) {
    console.log('🔥 SUPERAPP CHAT:', body.message);
    return this.superAppService.chat(body.message, body.language || 'auto', body.history || []);
  }

  @Public()
  @Get('gallery')
  async gallery() {
    return this.superAppService.chat('show gallery', 'en', []);
  }

  @Public()
  @Get('health')
  async health() {
    return { status: 'ok', version: 'V3.5-POLISHED-VOICE', engines: 12, features: ['image-real','email-real','gallery','automation','trading','code','voice'] };
  }
}
