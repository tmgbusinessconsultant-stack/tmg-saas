import { randomUUID } from 'node:crypto';
import { resolveCname } from 'node:dns/promises';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import sharp from 'sharp';
import {
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class CreateSiteDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsObject()
  settings?: Prisma.InputJsonValue;
}

type SiteSettings = {
  initialHero?: {
    heading?: unknown;
    subtext?: unknown;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function defaultHomepage(name: string, settings?: Prisma.InputJsonValue): Prisma.InputJsonObject {
  const parsedSettings = isRecord(settings) ? settings as SiteSettings : {};
  const hero = isRecord(parsedSettings.initialHero) ? parsedSettings.initialHero : {};
  const title = typeof hero.heading === 'string' ? hero.heading : `Welcome to ${name}`;
  const subtitle = typeof hero.subtext === 'string'
    ? hero.subtext
    : `Discover how ${name} can support your business.`;

  return {
    root: { props: { siteName: name, bg: '#ffffff' } },
    content: [
      {
        type: 'Hero',
        props: {
          id: 'hero',
          title,
          subtitle,
          ctaText: 'Contact us',
          ctaLink: '/contact',
          bg: '#0a2540',
          textColor: '#ffffff',
        },
      },
      {
        type: 'FeaturesMatrix',
        props: {
          id: 'features',
          sectionTitle: `How ${name} can help`,
          itemsJson: JSON.stringify([
            { title: 'Expert guidance', desc: 'Practical support tailored to your business goals.', icon: '💼' },
            { title: 'Clear next steps', desc: 'A focused plan to help move your business forward.', icon: '🧭' },
          ]),
        },
      },
    ],
  };
}

function normalizeDomain(value: string): string {
  const domain = value.trim().toLowerCase().replace(/\.$/, '');
  if (
    domain.length > 253
    || !domain.includes('.')
    || domain.split('.').some((label) => !/^(?!-)[a-z0-9-]{1,63}(?<!-)$/.test(label))
  ) {
    throw new BadRequestException('Enter a valid domain name without a URL, path, or port.');
  }
  return domain;
}

@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService) {}

  async createSite(userId: string, dto: CreateSiteDto) {
    const [existingCount, userPlan] = await Promise.all([
      this.countSitesByUser(userId),
      this.prisma.userPlan.findFirst({
        where: { userId, status: { in: ['ACTIVE', 'APPROVED'] }, endDate: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        select: { planId: true },
      }),
    ]);

    const planName = userPlan?.planId.toLowerCase() || 'starter';
    const maxSites = planName.includes('business') ? 999 : planName.includes('pro') ? 5 : 1;
    if (existingCount >= maxSites) {
      throw new ForbiddenException(`Your ${planName} plan allows up to ${maxSites} site(s).`);
    }

    const prefix = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20) || 'site';
    const subdomain = `${prefix}-${randomUUID().replace(/-/g, '').slice(0, 8)}`;
    const settings = dto.settings ?? {};

    return this.prisma.$transaction(async (transaction) => {
      const site = await transaction.site.create({
        data: {
          userId,
          name: dto.name.trim(),
          subdomain,
          domain: `${subdomain}.tmgbusinessconsulting.com`,
          status: 'DRAFT',
          settings,
        },
      });

      await transaction.sitePage.create({
        data: {
          siteId: site.id,
          slug: 'home',
          title: 'Home',
          description: 'Home page',
          seoTitle: dto.name.trim(),
          seoDesc: 'Learn more about our services and how we can help your business.',
          content: defaultHomepage(dto.name.trim(), settings),
          schemaVersion: 2,
          isHome: true,
          order: 0,
        },
      });

      return transaction.site.findUniqueOrThrow({
        where: { id: site.id },
        include: { pages: { orderBy: { order: 'asc' } } },
      });
    });
  }

  async listSites(userId: string) {
    return this.prisma.site.findMany({
      where: { userId },
      include: { pages: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAllSites() {
    return this.prisma.site.findMany({
      include: { pages: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSiteForUser(siteId: string, userId: string) {
    const site = await this.prisma.site.findFirst({
      where: { id: siteId, userId },
      include: { pages: { orderBy: { order: 'asc' } } },
    });
    if (!site) throw new NotFoundException('Site not found.');
    return site;
  }

  async getBySubdomain(subdomain: string) {
    return this.prisma.site.findFirst({
      where: { subdomain, status: 'PUBLISHED' },
      include: { pages: { orderBy: { order: 'asc' } } },
    });
  }

  async getByCustomDomain(domain: string) {
    const normalizedDomain = normalizeDomain(domain);
    return this.prisma.site.findFirst({
      where: { domain: normalizedDomain, status: 'PUBLISHED' },
      include: { pages: { orderBy: { order: 'asc' } } },
    });
  }

  async updateSite(siteId: string, userId: string, body: Record<string, unknown>) {
    await this.assertOwner(siteId, userId);
    const data: Prisma.SiteUpdateInput = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 100) {
        throw new BadRequestException('Site name must be between 2 and 100 characters.');
      }
      data.name = body.name.trim();
    }
    if (body.settings !== undefined) {
      if (!isRecord(body.settings)) throw new BadRequestException('Site settings must be an object.');
      data.settings = body.settings as Prisma.InputJsonObject;
    }
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No supported site fields were provided.');
    }

    return this.prisma.site.update({ where: { id: siteId }, data });
  }

  async savePageLayout(siteId: string, slug: string, payload: unknown, userId: string) {
    await this.assertOwner(siteId, userId);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new BadRequestException('Page slug must use lowercase letters, numbers, and hyphens.');
    }
    if (!isRecord(payload)) throw new BadRequestException('Page content must be an object.');

    const meta = isRecord(payload.meta) ? payload.meta : {};
    let content: unknown = payload.data ?? payload.content ?? payload;
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content) as unknown;
      } catch {
        throw new BadRequestException('Page content contains invalid JSON.');
      }
    }
    if (Array.isArray(content)) content = { root: { props: {} }, content };
    if (!isRecord(content) || !Array.isArray(content.content)) {
      throw new BadRequestException('Page content must include a content array.');
    }
    if (content.root !== undefined && !isRecord(content.root)) {
      throw new BadRequestException('Page root content is invalid.');
    }

    const title = typeof meta.title === 'string'
      ? meta.title
      : isRecord(content.root) && isRecord(content.root.props) && typeof content.root.props.siteName === 'string'
        ? content.root.props.siteName
        : slug;
    const description = typeof meta.description === 'string' ? meta.description : '';

    return this.prisma.sitePage.upsert({
      where: { siteId_slug: { siteId, slug } },
      update: {
        content: content as Prisma.InputJsonValue,
        title,
        description,
        seoTitle: title,
        seoDesc: description,
        schemaVersion: 2,
      },
      create: {
        siteId,
        slug,
        title,
        description,
        content: content as Prisma.InputJsonValue,
        seoTitle: title,
        seoDesc: description,
        schemaVersion: 2,
        isHome: slug === 'home',
        order: slug === 'home' ? 0 : 1,
      },
    });
  }

  async deletePage(siteId: string, slug: string, userId: string) {
    await this.assertOwner(siteId, userId);
    if (slug === 'home') throw new BadRequestException('The home page cannot be deleted.');
    const result = await this.prisma.sitePage.deleteMany({ where: { siteId, slug } });
    if (result.count === 0) throw new NotFoundException('Page not found.');
    return { success: true };
  }

  async countSitesByUser(userId: string) {
    return this.prisma.site.count({ where: { userId } });
  }

  async updateHeader(siteId: string, userId: string, headerData: unknown, logoUrl?: string) {
    await this.assertOwner(siteId, userId);
    if (!isRecord(headerData)) throw new BadRequestException('Header settings must be an object.');
    const data: Prisma.SiteUpdateInput = { headerData: headerData as Prisma.InputJsonObject };
    if (logoUrl !== undefined) data.logoUrl = logoUrl;
    return this.prisma.site.update({ where: { id: siteId }, data });
  }

  async updateFooter(siteId: string, userId: string, footerData: unknown) {
    await this.assertOwner(siteId, userId);
    if (!isRecord(footerData)) throw new BadRequestException('Footer settings must be an object.');
    return this.prisma.site.update({
      where: { id: siteId },
      data: { footerData: footerData as Prisma.InputJsonObject },
    });
  }

  async addCustomDomain(siteId: string, userId: string, value: string) {
    const domain = normalizeDomain(value);
    await this.assertOwner(siteId, userId);

    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.siteDomain.findUnique({ where: { domain } });
      if (existing && existing.siteId !== siteId) {
        throw new ConflictException('This domain is already connected to another site.');
      }
      if (!existing) {
        await transaction.siteDomain.create({
          data: { siteId, domain, status: 'PENDING', sslStatus: 'PENDING' },
        });
      }
      return transaction.site.update({ where: { id: siteId }, data: { domain } });
    });
  }

  async verifyDomainPropagation(siteId: string, userId: string) {
    await this.assertOwner(siteId, userId);
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
      select: { domain: true },
    });
    if (!site?.domain) throw new BadRequestException('Connect a custom domain before verifying DNS.');

    let propagated = false;
    try {
      const records = await resolveCname(site.domain);
      propagated = records.some((record) => record.toLowerCase().replace(/\.$/, '') === 'tmgbusinessconsulting.com');
    } catch (error) {
      const code = isRecord(error) && typeof error.code === 'string' ? error.code : '';
      if (!['ENODATA', 'ENOTFOUND', 'ESERVFAIL', 'ETIMEOUT'].includes(code)) throw error;
    }

    await this.prisma.siteDomain.updateMany({
      where: { siteId, domain: site.domain },
      data: propagated
        ? { status: 'VERIFIED', sslStatus: 'PENDING', verifiedAt: new Date() }
        : { status: 'PENDING' },
    });
    return { domain: site.domain, propagated };
  }

  async uploadLogo(siteId: string, userId: string, file?: Express.Multer.File) {
    await this.assertOwner(siteId, userId);
    if (!file || file.size === 0) throw new BadRequestException('Choose an image file to upload.');
    if (file.size > 5 * 1024 * 1024) throw new BadRequestException('Logo files must be 5 MB or smaller.');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      throw new BadRequestException('Upload a JPEG, PNG, or WebP image.');
    }

    let image: Buffer;
    try {
      image = await sharp(file.buffer).rotate().resize({ width: 1200, height: 600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    } catch {
      throw new BadRequestException('The uploaded image could not be decoded.');
    }

    const filename = `${randomUUID()}.webp`;
    const directory = join(process.cwd(), 'uploads', 'logos');
    await mkdir(directory, { recursive: true });
    const filePath = join(directory, filename);
    await writeFile(filePath, image, { flag: 'wx' });
    const logoUrl = `/uploads/logos/${filename}`;

    try {
      const site = await this.prisma.site.update({
        where: { id: siteId },
        data: { logoUrl },
      });
      return { url: logoUrl, site };
    } catch (error) {
      await unlink(filePath);
      throw error;
    }
  }


  async updateSeo(siteId: string, userId: string, body: { title?: string; description?: string; slug?: string }) {
    await this.assertOwner(siteId, userId);
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 60) : undefined;
    const desc = typeof body.description === "string" ? body.description.trim().slice(0, 160) : undefined;
    // Save SEO on home page (where Google reads it) + also update site name if title given
    await this.prisma.sitePage.updateMany({
      where: { siteId, slug: "home" },
      data: { ...(title !== undefined ? { seoTitle: title, title } : {}), ...(desc !== undefined ? { seoDesc: desc, description: desc } : {}) },
    });
    if (title) await this.prisma.site.update({ where: { id: siteId }, data: { name: title } });
    return { ok: true, seoTitle: title, seoDesc: desc };
  }
  async publish(siteId: string, userId: string) {
    await this.assertOwner(siteId, userId);
    const homepage = await this.prisma.sitePage.findUnique({
      where: { siteId_slug: { siteId, slug: 'home' } },
      select: { id: true },
    });
    if (!homepage) throw new BadRequestException('Create a home page before publishing this site.');
    return this.prisma.site.update({
      where: { id: siteId },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
  }

  async deleteSite(siteId: string, userId: string) {
    await this.assertOwner(siteId, userId);
    return this.prisma.site.delete({ where: { id: siteId } });
  }

  private async assertOwner(siteId: string, userId: string): Promise<void> {
    const site = await this.prisma.site.findFirst({
      where: { id: siteId, userId },
      select: { id: true },
    });
    if (!site) throw new NotFoundException('Site not found.');
  }
}

