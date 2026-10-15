import { PrismaService } from '../../prisma/prisma.service';
export declare class StatsService {
    private prisma;
    constructor(prisma: PrismaService);
    getStats(): Promise<{
        totalMembers: number;
        totalPlans: number;
        totalRevenue: number;
    }>;
}
