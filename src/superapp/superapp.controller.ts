import { Controller, Post, Get, Body } from '@nestjs/common';
import { SuperAppService } from './superapp.service';

@Controller('admin/superapp')
export class SuperAppController {
  constructor(private readonly superAppService: SuperAppService) {}

  @Post('chat')
  async chat(@Body() body: { message: string; language?: string; history?: any[] }) {
    return this.superAppService.chat(body.message, body.language || 'auto', body.history || []);
  }

  @Get('gallery')
  async gallery() {
    return this.superAppService.chat('show gallery', 'en', []);
  }

  @Get('health')
  async health() {
    return { status: 'ok', version: 'V3.5-POLISHED', engines: 12, features: ['image-real','email-real','gallery','automation','trading','code'] };
  }
}
