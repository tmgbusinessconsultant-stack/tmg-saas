import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { resolve } from 'node:path';

let apiProcess: ChildProcess | undefined;

after(() => {
  if (apiProcess && !apiProcess.killed) {
    apiProcess.kill();
  }
});

test('boots the API and verifies the HTTP health and database check', async () => {
  const port = await getAvailablePort();
  const errors: string[] = [];
  apiProcess = spawn(
    process.execPath,
    ['-r', 'dotenv/config', 'dist/src/main.js'],
    {
      cwd: resolve(__dirname, '../..'),
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PAYPAL_MODE: 'sandbox',
        PAYPAL_ENV: '',
        PAYPAL_SECRET: '',
        PORT: String(port),
      },
      stdio: ['ignore', 'ignore', 'pipe'],
    },
  );
  apiProcess.stderr?.setEncoding('utf8');
  apiProcess.stderr?.on('data', (chunk: string) => errors.push(chunk));
  apiProcess.on('error', (error) => errors.push(error.message));

  const deadline = Date.now() + 30_000;
  let response: Response | undefined;
  let lastError: unknown;
  while (Date.now() < deadline && apiProcess.exitCode === null) {
    try {
      response = await fetch(`http://127.0.0.1:${port}/api/health`);
      break;
    } catch (error) {
      lastError = error;
      await delay(250);
    }
  }

  assert.ok(
    response,
    `API did not become ready. Last error: ${String(lastError)}\n${errors.join('')}`,
  );
  const body = await response.text();
  assert.equal(response.status, 200, `Health response: ${body}\n${errors.join('')}`);
  assert.equal(errors.join(''), '', `API logged errors during startup:\n${errors.join('')}`);
  const health: unknown = JSON.parse(body);
  assert.ok(health && typeof health === 'object');
  assert.equal(Reflect.get(health, 'status'), 'ok');
  assert.equal(Reflect.get(health, 'database'), 'ok');
  assert.equal(typeof Reflect.get(health, 'uptime'), 'number');
});

async function getAvailablePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Unable to allocate an ephemeral API test port');
  }
  await new Promise<void>((resolveClose, reject) => {
    server.close((error) => (error ? reject(error) : resolveClose()));
  });
  return address.port;
}
