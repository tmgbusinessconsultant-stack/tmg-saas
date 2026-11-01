import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async createOrder(): Promise<never> {
    throw new ServiceUnavailableException(
      'PayPal order checkout is disabled until server-side order creation and capture verification are configured.',
    );
  }

  async captureOrder(): Promise<never> {
    throw new ServiceUnavailableException(
      'PayPal order checkout is disabled until server-side order creation and capture verification are configured.',
    );
  }

  async createShopOrder(): Promise<never> {
    throw new ServiceUnavailableException(
      'Online shop checkout is disabled until PayPal order creation is configured.',
    );
  }

  async captureShopOrder(): Promise<never> {
    throw new ServiceUnavailableException(
      'Online shop checkout is disabled until PayPal capture verification is configured.',
    );
  }

  async getPayments() {
    return this.prisma.payment.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getStats() {
    const total = await this.prisma.payment.count();
    const revenue = await this.prisma.payment.aggregate({ _sum: { amount: true } });
    return { total, revenue: Number(revenue._sum?.amount || 0) };
  }
}
