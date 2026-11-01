import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../src/prisma/prisma.service';
import type { AuthenticatedUser } from '../../src/auth/auth.service';
import { assertFormAccess, assertSiteAccess } from '../../src/common/site-access';

type Query = Record<string, unknown>;

function createPrismaMock(result: { id: string } | null) {
  const siteQueries: Query[] = [];
  const formQueries: Query[] = [];

  const prisma = {
    site: {
      findFirst: async (query: Query) => {
        siteQueries.push(query);
        return result;
      },
    },
    form: {
      findFirst: async (query: Query) => {
        formQueries.push(query);
        return result;
      },
    },
  } as unknown as PrismaService;

  return { prisma, siteQueries, formQueries };
}

function user(role: AuthenticatedUser['role'], id = 'user-1'): AuthenticatedUser {
  return {
    id,
    email: `${id}@example.test`,
    name: id,
    role,
    permissions: [],
  };
}

describe('site and form ownership checks', () => {
  it('scopes site access to the authenticated owner', async () => {
    const { prisma, siteQueries } = createPrismaMock({ id: 'site-1' });

    await assertSiteAccess(prisma, 'site-1', user('CLIENT'));

    assert.deepEqual(siteQueries[0]?.where, { id: 'site-1', userId: 'user-1' });
  });

  it('does not disclose sites owned by another user', async () => {
    const { prisma } = createPrismaMock(null);

    await assert.rejects(
      assertSiteAccess(prisma, 'site-1', user('CLIENT')),
      (error: unknown) => error instanceof NotFoundException,
    );
  });

  it('allows Super Admin site access without an owner restriction', async () => {
    const { prisma, siteQueries } = createPrismaMock({ id: 'site-1' });

    await assertSiteAccess(prisma, 'site-1', user('SUPER_ADMIN'));

    assert.deepEqual(siteQueries[0]?.where, { id: 'site-1' });
  });

  it('scopes form access through its owning site', async () => {
    const { prisma, formQueries } = createPrismaMock({ id: 'form-1' });

    await assertFormAccess(prisma, 'form-1', user('CLIENT'));

    assert.deepEqual(formQueries[0]?.where, {
      id: 'form-1',
      site: { is: { userId: 'user-1' } },
    });
  });

  it('does not disclose forms owned by another user', async () => {
    const { prisma } = createPrismaMock(null);

    await assert.rejects(
      assertFormAccess(prisma, 'form-1', user('CLIENT')),
      (error: unknown) => error instanceof NotFoundException,
    );
  });

  it('allows Super Admin form access without an owner restriction', async () => {
    const { prisma, formQueries } = createPrismaMock({ id: 'form-1' });

    await assertFormAccess(prisma, 'form-1', user('SUPER_ADMIN'));

    assert.deepEqual(formQueries[0]?.where, { id: 'form-1' });
  });
});
