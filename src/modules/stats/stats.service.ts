import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StatsService {
    constructor(private prisma: PrismaService) { }

    async getStats() {
        const totalMembers = await this.prisma.member.count();
        const totalPlans = await this.prisma.membershipPlan.count();
        const subscriptions = await this.prisma.subscription.findMany();

        let totalRevenue = subscriptions.reduce((sum, sub) => {
            return sum + (sub.amountPaid || 0);
        }, 0);

        // Demo fallback: if no subscription payment yet, use 199 per member
        if (totalRevenue === 0 && totalMembers > 0) {
            totalRevenue = totalMembers * 199;
        }

        return {
            totalMembers,
            totalPlans,
            totalRevenue,
        };
    }
}