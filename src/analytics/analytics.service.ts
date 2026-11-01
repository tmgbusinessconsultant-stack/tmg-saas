import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { assertSiteAccess } from '../common/site-access';
import type { AuthenticatedUser } from '../auth/auth.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  trackSiteView(siteId: string, meta: any) {
    return this.prisma.siteView.create({
      data: { siteId, ip: meta.ip?.substring(0,45), userAgent: meta.ua?.substring(0,500), referrer: meta.referrer?.substring(0,500) }
    });
  }

  trackFormView(formId: string, siteId?: string) {
    return this.prisma.formView.create({ data: { formId, siteId: siteId || null } });
  }

  async getSiteStats(siteId: string, user: AuthenticatedUser) {
    await assertSiteAccess(this.prisma, siteId, user);
    const now = new Date();
    const today = new Date(); today.setHours(0,0,0,0);
    const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);

    const [totalViews, todayViews, weekViews, totalSubs, forms] = await Promise.all([
      this.prisma.siteView.count({ where: { siteId } }),
      this.prisma.siteView.count({ where: { siteId, createdAt: { gte: today } } }),
      this.prisma.siteView.count({ where: { siteId, createdAt: { gte: weekAgo } } }),
      this.prisma.formSubmission.count({ where: { form: { siteId } } }),
      this.prisma.form.findMany({ where: { siteId }, include: { _count: { select: { submissions: true } } } })
    ]);

    const formStats = await Promise.all(forms.map(async (f) => {
      const views = await this.prisma.formView.count({ where: { formId: f.id } });
      const subs = f._count.submissions;
      return {
        id: f.id, name: f.name, views, submissions: subs,
        conversion: views > 0 ? Number(((subs/views)*100).toFixed(1)) : 0
      }
    }));

    const daily = await this.prisma.$queryRaw<Array<{ date: Date; count: number }>>`
      SELECT DATE("createdAt") as date, COUNT(*)::int as count
      FROM "SiteView" WHERE "siteId" = ${siteId} AND "createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY DATE("createdAt") ORDER BY date ASC
    `;

    return { totalViews, todayViews, weekViews, totalSubs, formStats, daily };
  }
}
