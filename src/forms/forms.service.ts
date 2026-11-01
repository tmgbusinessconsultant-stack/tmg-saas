import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { assertFormAccess, assertSiteAccess } from '../common/site-access';
import type { AuthenticatedUser } from '../auth/auth.service';

@Injectable()
export class FormsService {
  constructor(private prisma: PrismaService) {}

  async create(siteId: string, dto: any, user: AuthenticatedUser) {
    await assertSiteAccess(this.prisma, siteId, user);
    return this.prisma.form.create({ data: { ...dto, siteId } });
  }

  async findBySite(siteId: string, user: AuthenticatedUser) {
    await assertSiteAccess(this.prisma, siteId, user);
    return this.prisma.form.findMany({ where: { siteId }, orderBy: { createdAt: 'desc' }, include: { _count: { select: { submissions: true } } } });
  }

  async findOne(formId: string) {
    return this.prisma.form.findUnique({ where: { id: formId } });
  }

  async update(formId: string, dto: any, user: AuthenticatedUser) {
    await assertFormAccess(this.prisma, formId, user);
    return this.prisma.form.update({ where: { id: formId }, data: dto });
  }

  async remove(formId: string, user: AuthenticatedUser) {
    await assertFormAccess(this.prisma, formId, user);
    return this.prisma.form.delete({ where: { id: formId } });
  }

  async submit(formId: string, data: any) {
    // Save submission
    const submission = await this.prisma.formSubmission.create({ data: { formId, data } });
    return { ok: true, message: 'Form submitted successfully', id: submission.id };
  }

  async getSubmissions(formId: string, user: AuthenticatedUser) {
    await assertFormAccess(this.prisma, formId, user);
    return this.prisma.formSubmission.findMany({ where: { formId }, orderBy: { createdAt: 'desc' } });
  }

  async getSubmissionsBySite(siteId: string, user: AuthenticatedUser) {
    await assertSiteAccess(this.prisma, siteId, user);
    return this.prisma.formSubmission.findMany({
      where: { form: { siteId } },
      orderBy: { createdAt: 'desc' },
      include: { form: { select: { name: true, type: true } } },
      take: 100,
    });
  }
}
