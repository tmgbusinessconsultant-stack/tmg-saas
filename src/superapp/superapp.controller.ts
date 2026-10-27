import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SuperAppService } from './superapp.service';
import { SuperAppChatDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/superapp')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SuperAppController {
  constructor(private superapp: SuperAppService) {}
  @Post('chat')
  async chat(@Body() dto: SuperAppChatDto) {
    return this.superapp.chat(dto.message, dto.language || 'en', dto.history || []);
  }
}
