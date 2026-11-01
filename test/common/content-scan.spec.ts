import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AuthenticatedUser } from '../../src/auth/auth.service';
import { ContentService } from '../../src/content/content.service';
import type { CmsMediaStorageService } from '../../src/content/cms-media-storage.service';
import type { PrismaService } from '../../src/prisma/prisma.service';

function createService(scanResult: string | null) {
  const updates: Array<Record<string, unknown>> = [];
  const prisma = {
    contentMedia: {
      findUnique: async () => ({ id: 'media-1', storageKey: 'media/object-1', status: 'SCANNING' }),
      updateMany: async (query: Record<string, unknown>) => {
        updates.push(query);
        return { count: 1 };
      },
    },
    contentAuditLog: {
      create: async () => ({ id: 'audit-1' }),
    },
  } as unknown as PrismaService;
  const storage = {
    getScanResult: async () => scanResult,
  } as CmsMediaStorageService;
  return {
    service: new ContentService(prisma, storage),
    updates,
  };
}

const admin: AuthenticatedUser = {
  id: 'admin-1',
  email: 'admin@example.test',
  name: 'Admin',
  role: 'SUPER_ADMIN',
  permissions: [],
};

describe('CMS malware scan gate', () => {
  it('marks media available only after GuardDuty reports no threats', async () => {
    const { service, updates } = createService('NO_THREATS_FOUND');

    const result = await service.refreshMediaScan('media-1', admin);

    assert.deepEqual(result, {
      id: 'media-1',
      status: 'AVAILABLE',
      scanned: true,
      scanResult: 'NO_THREATS_FOUND',
    });
    assert.deepEqual(updates[0]?.data, { status: 'AVAILABLE' });
  });

  it('rejects media when GuardDuty detects threats', async () => {
    const { service, updates } = createService('THREATS_FOUND');

    const result = await service.refreshMediaScan('media-1', admin);

    assert.equal(result.status, 'REJECTED');
    assert.equal(result.scanned, true);
    assert.deepEqual(updates[0]?.data, { status: 'REJECTED' });
  });

  it('keeps media unavailable when the scan tag is still pending', async () => {
    const { service, updates } = createService(null);

    const result = await service.refreshMediaScan('media-1', admin);

    assert.equal(result.status, 'SCANNING');
    assert.equal(result.scanned, false);
    assert.equal(updates.length, 0);
  });

  it('does not approve an unrecognized GuardDuty result', async () => {
    const { service, updates } = createService('UNKNOWN');

    const result = await service.refreshMediaScan('media-1', admin);

    assert.equal(result.status, 'SCANNING');
    assert.equal(result.scanned, false);
    assert.equal(updates.length, 0);
  });
});
