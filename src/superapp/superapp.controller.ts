import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SuperAppService } from './superapp.service';
import { SuperAppChatDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/superapp')
@UseGuards(JwtAuthGuard)
export class SuperAppController {
  constructor(private superapp: SuperAppService) {}
  @Post('chat')
  async chat(@Body() dto: SuperAppChatDto) {
    return this.superapp.chat(dto.message, dto.language || 'en', dto.history || []);
  }
}
