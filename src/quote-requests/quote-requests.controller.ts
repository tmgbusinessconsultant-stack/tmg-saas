import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/public.decorator';
import { Permissions } from '../auth/permissions.decorator';
import { TurnstileService } from '../common/turnstile/turnstile.service'; // FIX: was ../ai/turnstile.service
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';
import { QuoteRequestsService } from './quote-requests.service';

@Controller('quote-requests')
export class QuoteRequestsController {
  constructor(
    private readonly service: QuoteRequestsService,
    private readonly turnstile: TurnstileService,
  ) { }

  @Public()
  @Post()
  async create(@Body() dto: CreateQuoteRequestDto, @Req() request: Request) {
    // FIX: pass action 'quote_submit' for Spin validation + use request.ip
    const ip = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || request.ip;
    await this.turnstile.verify(dto.turnstileToken, ip, 'quote_submit');
    return this.service.create(dto);
  }

  @Permissions('finance:manage')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Permissions('finance:manage')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateQuoteStatusDto) {
    return this.service.updateStatus(id, dto.status);
  }
}