import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, test } from 'node:test';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.E2E_DATABASE_URL;
const registeredEmails: string[] = [];
let apiProcess: ChildProcess | undefined;
let apiPort: number | undefined;

after(async () => {
  try {
    if (databaseUrl) {
      const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
      try {
        const users = await prisma.user.findMany({
          where: { email: { in: registeredEmails } },
          select: { id: true },
        });
        const userIds = users.map(({ id }) => id);
        if (userIds.length > 0) {
          await prisma.project.deleteMany({ where: { ownerId: { in: userIds } } });
          await prisma.user.deleteMany({ where: { id: { in: userIds } } });
        }
      } finally {
        await prisma.$disconnect();
      }
    }
  } finally {
    await stopApi();
  }
});

test('authentication registration, login, logout, and protected routes', {
  skip: databaseUrl ? false : 'Set E2E_DATABASE_URL to an isolated disposable PostgreSQL database.',
}, async () => {
  const api = await startApi();
  const email = `auth-e2e-${randomUUID()}@example.test`;
  registeredEmails.push(email);

  const anonymousProfile = await api.request('auth/me');
  assert.equal(anonymousProfile.status, 401);
  const anonymousProjects = await api.request('projects');
  assert.equal(anonymousProjects.status, 401);

  const registration = await api.request('auth/register', {
    method: 'POST',
    body: { email, name: 'Auth E2E', password: 'SafeTestPassword-401!' },
  });
  assert.equal(registration.status, 202);

  const login = await api.request('auth/login', {
    method: 'POST',
    body: { email, password: 'SafeTestPassword-401!' },
  });
  assert.equal(login.status, 201);
  const loginBody = await readObject(login);
  assert.equal(typeof loginBody.accessToken, 'string');
  const token = loginBody.accessToken as string;
  assert.equal(Reflect.get(loginBody.user as object, 'role'), 'CLIENT');

  const authenticatedProfile = await api.request('auth/me', { token });
  assert.equal(authenticatedProfile.status, 200);
  const profile = await readObject(authenticatedProfile);
  assert.equal(profile.email, email);
  assert.deepEqual(profile.permissions, ['projects:create', 'projects:read', 'projects:update']);
  const staffDirectory = await api.request('projects/staff', { token });
  assert.equal(staffDirectory.status, 403);

  const logout = await api.request('auth/logout', { method: 'POST', token });
  assert.equal(logout.status, 201);
  const expiredProfile = await api.request('auth/me', { token });
  assert.equal(expiredProfile.status, 401);
});

test('client project lifecycle is owner-scoped for create, edit, list, and delete', {
  skip: databaseUrl ? false : 'Set E2E_DATABASE_URL to an isolated disposable PostgreSQL database.',
}, async () => {
  const api = await startApi();
  const owner = await registerAndLogin(api, 'project-owner');
  const otherClient = await registerAndLogin(api, 'project-other-client');

  const created = await api.request('projects', {
    method: 'POST',
    token: owner.token,
    body: { title: 'E2E Project', description: 'Created by the project owner', serviceType: 'CONSULTING' },
  });
  assert.equal(created.status, 201);
  const project = await readObject(created);
  assert.equal(project.ownerId, owner.id);
  assert.equal(project.status, 'PENDING');
  const projectId = project.id as string;

  const ownerProjects = await api.request('projects', { token: owner.token });
  assert.equal(ownerProjects.status, 200);
  assert.ok((await readArray(ownerProjects)).some((item) => item.id === projectId));
  const otherProjects = await api.request('projects', { token: otherClient.token });
  assert.equal(otherProjects.status, 200);
  assert.ok(!(await readArray(otherProjects)).some((item) => item.id === projectId));

  const deniedEdit = await api.request(`projects/${projectId}`, {
    method: 'PATCH',
    token: otherClient.token,
    body: { title: 'Unauthorized edit' },
  });
  assert.equal(deniedEdit.status, 403);
  const deniedDelete = await api.request(`projects/${projectId}`, {
    method: 'DELETE',
    token: otherClient.token,
  });
  assert.equal(deniedDelete.status, 403);

  const edited = await api.request(`projects/${projectId}`, {
    method: 'PATCH',
    token: owner.token,
    body: { title: 'Updated E2E Project', description: 'Owner edit', status: 'APPROVED' },
  });
  assert.equal(edited.status, 200);
  const editedProject = await readObject(edited);
  assert.equal(editedProject.title, 'Updated E2E Project');
  assert.equal(editedProject.description, 'Owner edit');
  assert.equal(editedProject.status, 'PENDING');

  const deleted = await api.request(`projects/${projectId}`, {
    method: 'DELETE',
    token: owner.token,
  });
  assert.equal(deleted.status, 200);
  assert.deepEqual(await readObject(deleted), { success: true });
  const remainingProjects = await api.request('projects', { token: owner.token });
  assert.ok(!(await readArray(remainingProjects)).some((item) => item.id === projectId));
});

async function registerAndLogin(api: ApiClient, prefix: string): Promise<{ id: string; token: string }> {
  const email = `${prefix}-${randomUUID()}@example.test`;
  registeredEmails.push(email);
  const registration = await api.request('auth/register', {
    method: 'POST',
    body: { email, name: 'Project E2E', password: 'SafeTestPassword-401!' },
  });
  assert.equal(registration.status, 202);
  const login = await api.request('auth/login', {
    method: 'POST',
    body: { email, password: 'SafeTestPassword-401!' },
  });
  assert.equal(login.status, 201);
  const loginBody = await readObject(login);
  const user = loginBody.user as Record<string, unknown>;
  return { id: user.id as string, token: loginBody.accessToken as string };
}

class ApiClient {
  constructor(private readonly port: number) {}

  request(
    path: string,
    options: { method?: string; token?: string; body?: unknown } = {},
  ): Promise<Response> {
    const headers: Record<string, string> = {};
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.token) headers.Authorization = `Bearer ${options.token}`;
    return fetch(`http://127.0.0.1:${this.port}/api/${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  }
}

async function startApi(): Promise<ApiClient> {
  if (apiProcess && apiPort) return new ApiClient(apiPort);
  if (!databaseUrl) throw new Error('E2E_DATABASE_URL must point to an isolated disposable PostgreSQL database.');
  const port = await getAvailablePort();
  const errors: string[] = [];
  apiProcess = spawn(process.execPath, ['-r', 'dotenv/config', 'dist/src/main.js'], {
    cwd: resolve(__dirname, '../..'),
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      NODE_ENV: 'test',
      PAYPAL_MODE: 'sandbox',
      PAYPAL_ENV: '',
      PAYPAL_SECRET: '',
      PORT: String(port),
    },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  apiProcess.stderr?.setEncoding('utf8');
  apiProcess.stderr?.on('data', (chunk: string) => errors.push(chunk));
  apiProcess.on('error', (error) => errors.push(error.message));

  const deadline = Date.now() + 30_000;
  let lastError: unknown;
  while (Date.now() < deadline && apiProcess.exitCode === null) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) {
        apiPort = port;
        return new ApiClient(port);
      }
      lastError = `Health check returned ${response.status}.`;
    } catch (error) {
      lastError = error;
    }
    await delay(250);
  }
  await stopApi();
  throw new Error(`API did not become ready. Last error: ${String(lastError)}\n${errors.join('')}`);
}

async function stopApi(): Promise<void> {
  if (!apiProcess) return;
  if (apiProcess.exitCode === null) {
    await new Promise<void>((resolveExit) => {
      apiProcess?.once('exit', () => resolveExit());
      apiProcess?.kill();
    });
  }
  apiProcess = undefined;
  apiPort = undefined;
}

async function getAvailablePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Unable to allocate an ephemeral API test port.');
  }
  await new Promise<void>((resolveClose, reject) => {
    server.close((error) => (error ? reject(error) : resolveClose()));
  });
  return address.port;
}

async function readObject(response: Response): Promise<Record<string, unknown>> {
  const value: unknown = await response.json();
  assert.ok(value && typeof value === 'object' && !Array.isArray(value));
  return value as Record<string, unknown>;
}

async function readArray(response: Response): Promise<Array<Record<string, unknown>>> {
  const value: unknown = await response.json();
  assert.ok(Array.isArray(value));
  return value as Array<Record<string, unknown>>;
}
