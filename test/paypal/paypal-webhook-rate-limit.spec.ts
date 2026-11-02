import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express = require('express');
import { createPayPalWebhookRateLimit } from '../../src/paypal/paypal-webhook-rate-limit';

let server: ReturnType<ReturnType<typeof express>['listen']> | undefined;

after(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server?.close((error) => (error ? reject(error) : resolve()));
  });
});

test('limits repeated requests to the PayPal webhook path', async () => {
  const app = express();
  app.post('/webhook', createPayPalWebhookRateLimit(), (_request, response) => response.sendStatus(200));
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => {
    server?.once('listening', resolve);
    server?.once('error', reject);
  });
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  const responses = await Promise.all(
    Array.from({ length: 31 }, () => fetch(`http://127.0.0.1:${address.port}/webhook`, { method: 'POST' })),
  );
  assert.equal(responses.filter((response) => response.status === 200).length, 30);
  assert.equal(responses.filter((response) => response.status === 429).length, 1);
});
