import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const totalUsers = await this.prisma.user.count();
    const activePlans = await this.prisma.userPlan.count({ where: { status: 'ACTIVE' } });
    const totalPlans = await this.prisma.userPlan.count();
    const blockedPlans = await this.prisma.userPlan.count({ where: { status: 'BLOCKED' } });
    const totalPayments = await this.prisma.payment.count().catch(()=>0);
    const revenue = await this.prisma.payment.aggregate({ 
      where: { status: 'COMPLETED' }, 
      _sum: { amount: true } 
    }).catch(()=>({ _sum:{ amount:0 } } as any));

    return {
      totalUsers,
      activePlans,
      totalPlans,
      blockedPlans,
      totalEnquiries: 0,
      pendingEnquiries: 0,
      totalRevenue: (revenue as any)._sum?.amount || 0,
      totalPayments,
    };
  }
}
