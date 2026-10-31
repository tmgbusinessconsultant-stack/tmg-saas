import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SitesService {
  constructor(private prisma: PrismaService) { }

  async createSite(userId: string, dto: any) {
    const existingCount = await this.countSitesByUser(userId);
    if (existingCount >= 1) {
      throw new NotFoundException('Limit: 1 site per account. Contact admin to upgrade.');
    }

    const subdomain = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20) + '-' + Date.now().toString().slice(-4);
    const site = await (this.prisma as any).site.create({
      data: {
        userId,
        name: dto.name,
        subdomain,
        domain: subdomain + '.tmgbusinessconsulting.com',
        status: 'DRAFT',
        settings: dto.settings || {},
      },
    });
    await (this.prisma as any).sitePage.create({
      data: {
        siteId: site.id,
        slug: 'home',
        title: 'Home',
        description: 'Home page',
        seoTitle: dto.name,
        seoDesc: dto.settings?.initialHero?.subtext || 'Helping businesses grow in Qatar',
        content: dto.settings?.initialHero ? {
          content: [
            { type: "Heading", props: { id: "hero_h", text: dto.settings.initialHero.heading, level: "h1" } },
            { type: "Text", props: { id: "hero_t", text: dto.settings.initialHero.subtext } }
          ],
          root: { props: { siteName: dto.name } }
        } : { content: [], root: { props: { siteName: dto.name } } },
        schemaVersion: 2,
        isHome: true,
        order: 0,
      },
    });
    return site;
  }

  async listSites(userId: string) {
    return (this.prisma as any).site.findMany({ where: { userId }, include: { pages: true }, orderBy: { createdAt: 'desc' } });
  }

  async getSite(id: string) {
    const site = await (this.prisma as any).site.findUnique({ where: { id }, include: { pages: { orderBy: { order: 'asc' } } } });
    if (!site) throw new NotFoundException('Site not found');
    return site;
  }

  async getSiteByDomain(domain: string) {
    return (this.prisma as any).site.findFirst({ where: { OR: [{ domain }, { subdomain: domain }] }, include: { pages: { orderBy: { order: 'asc' } } } });
  }

  async getSiteBySubdomain(subdomain: string) {
    return (this.prisma as any).site.findFirst({ where: { subdomain }, include: { pages: { orderBy: { order: 'asc' } } } });
  }

  async updatePage(siteId: string, slug: string, payload: any) {
    return this.savePageLayout(siteId, slug, payload);
  }

  async savePageLayout(siteId: string, slug: string, payload: any) {
    let finalContent: any = payload?.data || payload?.content || payload;
    if (typeof finalContent === 'string') {
      try { finalContent = JSON.parse(finalContent); } catch { finalContent = { content: [], root: { props: {} } }; }
    }
    if (!finalContent.content && !finalContent.root) {
      finalContent = { content: Array.isArray(finalContent) ? finalContent : [], root: { props: {} } };
    }
    const meta = payload?.meta || {};
    const title = meta.title || finalContent?.root?.props?.siteName || finalContent?.title || slug;
    const description = meta.description || '';

    return (this.prisma as any).sitePage.upsert({
      where: { siteId_slug: { siteId, slug } },
      update: {
        content: finalContent,
        title,
        description,
        seoTitle: meta.title || title,
        seoDesc: description,
        schemaVersion: 2,
      },
      create: {
        siteId,
        slug,
        title: title || 'Untitled',
        description,
        content: finalContent,
        seoTitle: meta.title,
        seoDesc: description,
        schemaVersion: 2,
        isHome: slug === 'home',
        order: slug === 'home' ? 0 : 1,
      },
    });
  }

  async deletePage(siteId: string, slug: string) {
    if (slug === 'home') throw new NotFoundException('Cannot delete home');
    return (this.prisma as any).sitePage.delete({ where: { siteId_slug: { siteId, slug } } });
  }

  async listAllSites() {
    return (this.prisma as any).site.findMany({ 
      include: { pages: true, user: { select: { id: true, email: true, name: true } } }, 
      orderBy: { createdAt: 'desc' } 
    });
  }

  async countSitesByUser(userId: string) {
    return (this.prisma as any).site.count({ where: { userId } });
  }

  async updateHeader(siteId: string, userId: string, headerData: any, logoUrl?: string) {
    const site = await (this.prisma as any).site.findFirst({ where: { id: siteId, userId } });
    if (!site) throw new NotFoundException('Site not found');
    const data: any = {};
    if (headerData !== null && headerData !== undefined) data.headerData = headerData;
    if (logoUrl) data.logoUrl = logoUrl;
    return (this.prisma as any).site.update({
      where: { id: siteId },
      data,
    });
  }

  async updateFooter(siteId: string, userId: string, footerData: any) {
    const site = await (this.prisma as any).site.findFirst({ where: { id: siteId, userId } });
    if (!site) throw new NotFoundException('Site not found');
    return (this.prisma as any).site.update({
      where: { id: siteId },
      data: { footerData },
    });
  }

  async addCustomDomain(siteId: string, userId: string, domain: string) {
    const site = await (this.prisma as any).site.findFirst({ where: { id: siteId, userId } });
    if (!site) throw new NotFoundException('Site not found');
    const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const existing = await (this.prisma as any).siteDomain.findUnique({ where: { domain: cleanDomain } }).catch(()=>null);
    if (existing) throw new NotFoundException('Domain already in use');
    await (this.prisma as any).siteDomain.create({
      data: { siteId, domain: cleanDomain, status: 'PENDING', sslStatus: 'PENDING' },
    });
    return (this.prisma as any).site.update({
      where: { id: siteId },
      data: { domain: cleanDomain },
    });
  }

  async publish(siteId: string) {
    return (this.prisma as any).site.update({ where: { id: siteId }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
  }

  async deleteSite(siteId: string, userId: string) {
    const site = await (this.prisma as any).site.findFirst({ where: { id: siteId, userId } });
    if (!site) throw new NotFoundException('Site not found');
    await (this.prisma as any).page.deleteMany({ where: { siteId } });
    return (this.prisma as any).site.delete({ where: { id: siteId } });
  }
}




