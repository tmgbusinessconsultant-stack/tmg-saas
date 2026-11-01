import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ForbiddenException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { PrismaService } from '../../src/prisma/prisma.service';
import type { AuthenticatedUser } from '../../src/auth/auth.service';
import { ProjectsService } from '../../src/projects/projects.service';

const client: AuthenticatedUser = {
  id: 'client-1',
  email: 'client@example.test',
  name: 'Client',
  role: 'CLIENT',
  permissions: ['projects:read', 'projects:write'],
};

function makeService(file: Record<string, unknown> | null, projectOwnerId = client.id) {
  const projectQueries: Record<string, unknown>[] = [];
  const fileQueries: Record<string, unknown>[] = [];
  const projectFileUpdates: Record<string, unknown>[] = [];
  const prisma = {
    project: {
      findUnique: async (query: Record<string, unknown>) => {
        projectQueries.push(query);
        return { id: 'project-owned', ownerId: projectOwnerId, assigneeId: null };
      },
    },
    projectFile: {
      findFirst: async (query: Record<string, unknown>) => {
        fileQueries.push(query);
        return file;
      },
      update: async (query: Record<string, unknown>) => {
        projectFileUpdates.push(query);
        return query;
      },
    },
  } as unknown as PrismaService;
  return {
    service: new ProjectsService(prisma),
    projectQueries,
    fileQueries,
    projectFileUpdates,
  };
}

describe('project file security', () => {
  it('scopes file lookups to the requested owned project and never claims an unverified scan is clean', async () => {
    const { service, fileQueries } = makeService({
      id: 'file-1',
      projectId: 'project-owned',
      status: 'SCANNING',
    });

    const result = await service.scanStatus(client, 'project-owned', 'file-1');

    assert.deepEqual(fileQueries[0]?.where, { id: 'file-1', projectId: 'project-owned' });
    assert.deepEqual(result, { status: 'SCANNING', scanResult: null, scanned: false });
  });

  it('does not disclose or access a file from another project', async () => {
    const { service, fileQueries } = makeService(null);

    await assert.rejects(
      service.scanStatus(client, 'project-owned', 'other-project-file'),
      error => error instanceof NotFoundException,
    );
    assert.deepEqual(fileQueries[0]?.where, {
      id: 'other-project-file',
      projectId: 'project-owned',
    });
  });

  it('does not allow a client to access another client project', async () => {
    const { service } = makeService(null, 'client-2');

    await assert.rejects(
      service.scanStatus(client, 'project-owned', 'file-1'),
      error => error instanceof ForbiddenException,
    );
  });

  it('blocks downloads until a file is marked available', async () => {
    const { service } = makeService({
      id: 'file-1',
      projectId: 'project-owned',
      name: 'file.pdf',
      status: 'SCANNING',
    });

    await assert.rejects(
      service.handleFileDownload(client, 'project-owned', 'file-1'),
      error => error instanceof ForbiddenException,
    );
  });

  it('rejects path traversal even for an available file record', async () => {
    const { service } = makeService({
      id: 'file-1',
      projectId: 'project-owned',
      name: '..\\outside.txt',
      status: 'AVAILABLE',
    });

    await assert.rejects(
      service.handleFileDownload(client, 'project-owned', 'file-1'),
      error => error instanceof ForbiddenException,
    );
  });

  it('does not allow the placeholder multipart endpoint to mark uploads clean', async () => {
    const { service, projectFileUpdates } = makeService({
      id: 'file-1',
      projectId: 'project-owned',
      status: 'UPLOADING',
    });

    await assert.rejects(
      service.completeUpload(client, 'project-owned', 'file-1', []),
      error => error instanceof ServiceUnavailableException,
    );
    assert.equal(projectFileUpdates.length, 0);
  });
});
