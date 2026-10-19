import { Controller, Get, Post, Body } from '@nestjs/common';
import { Permissions } from '../auth/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Permissions('finance:manage')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get() async getAll() { return this.prisma.subscription.findMany({ orderBy: { createdAt: 'desc' } } as any); }
  @Post() async create(@Body() body: any) {
    const plan = await this.prisma.membershipPlan.findUnique({ where: { id: body.planId } });
    if(!plan) throw new Error('Plan not found');
    const start = new Date(body.startDate || new Date()); const end = new Date(start); end.setDate(end.getDate() + plan.duration);
    const sub = await this.prisma.subscription.create({ data: { memberId: body.memberId, planId: body.planId, startDate: start, endDate: end, status: 'ACTIVE', paymentStatus: 'PAID', paymentMethod: body.paymentMethod || 'CASH', amountPaid: body.amountPaid? parseFloat(body.amountPaid) : plan.price, remainingSessions: plan.sessions || null } as any });
    await this.prisma.member.update({ where: { id: body.memberId }, data: { status: 'ACTIVE' } }); return sub;
  }
}
