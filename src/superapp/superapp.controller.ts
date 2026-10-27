import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SuperAppService } from './superapp.service';
import { SuperAppChatDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/superapp')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SuperAppController {
  constructor(private superapp: SuperAppService) {}

  @Post('chat')
  async chat(@Body() dto: SuperAppChatDto) {
    return this.superapp.chat(dto.message, dto.language || 'en', dto.history || []);
  }

  @Post('translate')
  async translate(@Body() body: { text: string, to: string }) {
    return { translated: await this.superapp.translateBack(body.text, body.to) };
  }
}
