import { Controller, Get } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
@Controller('stats')
export class StatsController {
  @Get() async get() {
    const gym = await prisma.gym.findFirst();
    if(!gym) return { members: 0, active: 0, revenue: 0, plans: 0, currency: 'USD' };
    const members = await prisma.member.count({ where: { gymId: gym.id } });
    const active = await prisma.subscription.count({ where: { status: 'ACTIVE' } as any });
    const plans = await prisma.membershipPlan.count({ where: { gymId: gym.id } });
    const revenueAgg = await prisma.subscription.aggregate({ _sum: { amountPaid: true }, where: { paymentStatus: 'PAID' } as any });
    return { members, active, plans, revenue: (revenueAgg as any)._sum.amountPaid || 0, currency: 'USD' };
  }
}
