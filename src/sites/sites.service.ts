import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateSiteDto {
  name: string;
  settings?: any;
  domain?: string;
}

@Injectable()
export class SitesService {
  constructor(private prisma: PrismaService) {}

  async createSite(userId: string, dto: CreateSiteDto) {
    const existingCount = await this.countSitesByUser(userId);
    const userPlan = await (this.prisma as any).userPlan.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'APPROVED'] } },
      orderBy: { createdAt: 'desc' },
      include: { plan: true }
    }).catch(() => null);
    const planName = (userPlan?.plan?.name || userPlan?.planId || 'starter').toLowerCase();
    let maxSites = 1;
    if (planName.includes('business')) maxSites = 999;
    else if (planName.includes('pro')) maxSites = 5;
    if (existingCount >= maxSites) {
      throw new NotFoundException('Limit: ' + maxSites + ' site(s) for ' + planName + ' plan. Upgrade to create more.');
    }
    const site = await (this.prisma as any).site.create({
      data: {
        userId,
        name: dto.name,
        domain: dto.domain,
        settings: dto.settings,
      },
    });
    return site;
  }

  async listSites(userId: string) {
    return (this.prisma as any).site.findMany({ where: { userId }, include: { pages: true }, orderBy: { createdAt: 'desc' } });
  }

  async getSite(id: string, userId: string) {
    const site = await (this.prisma as any).site.findFirst({ where: { id, userId }, include: { pages: true } });
    if (!site) throw new NotFoundException('Site not found');
    return site;
  }

  async countSitesByUser(userId: string) {
    return (this.prisma as any).site.count({ where: { userId } });
  }
}
