import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { Public } from '../public.decorator';

@Controller('auth/whatsapp')
export class WhatsappController {
  constructor(private readonly wa: WhatsappService) {}

  @Public()
  @Get('status') status() { return this.wa.getStatus(); }

  @Public()
  @Get('webhook') verify(@Query('hub.mode') mode: string, @Query('hub.verify_token') token: string, @Query('hub.challenge') challenge: string) { return this.wa.verifyWebhook(mode, token, challenge); }

  @Public()
  @Post('webhook') incoming(@Body() body: any) { return this.wa.handleIncoming(body); }

  @Post('send') send(@Body() body: any) { return this.wa.sendMessage(body.to, body.message); }
}
