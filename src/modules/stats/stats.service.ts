import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const gym = await this.prisma.gym.findFirst();
    if (!gym) {
      return { members: 0, active: 0, plans: 0, revenue: 0, currency: 'USD' };
    }

    const [members, active, plans, revenue] = await Promise.all([
      this.prisma.member.count({ where: { gymId: gym.id } }),
      this.prisma.subscription.count({
        where: { status: 'ACTIVE', member: { gymId: gym.id } },
      }),
      this.prisma.membershipPlan.count({ where: { gymId: gym.id } }),
      this.prisma.subscription.aggregate({
        _sum: { amountPaid: true },
        where: { paymentStatus: 'PAID', member: { gymId: gym.id } },
      }),
    ]);

    return {
      members,
      active,
      plans,
      revenue: revenue._sum.amountPaid ?? 0,
      currency: gym.currency,
    };
  }
}