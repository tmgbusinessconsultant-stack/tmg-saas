import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.service';

export async function assertSiteAccess(
  prisma: PrismaService,
  siteId: string,
  user: AuthenticatedUser,
): Promise<void> {
  const site = await prisma.site.findFirst({
    where: user.role === 'SUPER_ADMIN'
      ? { id: siteId }
      : { id: siteId, userId: user.id },
    select: { id: true },
  });

  if (!site) {
    throw new NotFoundException('Site not found');
  }
}

export async function assertFormAccess(
  prisma: PrismaService,
  formId: string,
  user: AuthenticatedUser,
): Promise<void> {
  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      ...(user.role === 'SUPER_ADMIN' ? {} : { site: { is: { userId: user.id } } }),
    },
    select: { id: true },
  });

  if (!form) {
    throw new NotFoundException('Form not found');
  }
}
