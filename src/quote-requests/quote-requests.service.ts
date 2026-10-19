import { Injectable, NotFoundException } from '@nestjs/common';
import { QuoteStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';

@Injectable()
export class QuoteRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateQuoteRequestDto) {
    return this.prisma.quoteRequest.create({
      data: {
        fullName: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone?.trim() || null,
        company: dto.company?.trim() || null,
        service: dto.serviceType,
        details: dto.message?.trim() || '',
        source: dto.source ?? 'website',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        service: true,
        status: true,
        createdAt: true,
      },
    });
  }

  findAll() {
    return this.prisma.quoteRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async updateStatus(id: string, status: QuoteStatus) {
    const result = await this.prisma.quoteRequest.updateMany({
      where: { id },
      data: { status },
    });
    if (result.count === 0) {
      throw new NotFoundException('Quote request not found.');
    }
    return this.prisma.quoteRequest.findUniqueOrThrow({ where: { id } });
  }
}
