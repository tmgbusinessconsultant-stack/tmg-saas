import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentsService } from '../../src/payments/payments.service';
import { PaypalService } from '../../src/paypal/paypal.service';
import type { PrismaService } from '../../src/prisma/prisma.service';

const originalFetch = globalThis.fetch;
const originalEnvironment = {
  PAYPAL_MODE: process.env.PAYPAL_MODE,
  PAYPAL_ENV: process.env.PAYPAL_ENV,
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
  PAYPAL_SECRET: process.env.PAYPAL_SECRET,
  PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID,
};

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function configurePayPal() {
  process.env.PAYPAL_MODE = 'sandbox';
  delete process.env.PAYPAL_ENV;
  delete process.env.PAYPAL_SECRET;
  process.env.PAYPAL_CLIENT_ID = 'test-client-id';
  process.env.PAYPAL_CLIENT_SECRET = 'test-client-secret';
}

function mockFetch(responses: Array<{ status?: number; body: unknown }>) {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  let index = 0;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    requests.push({ url: String(input), init });
    const response = responses[index++];
    if (!response) throw new Error('Unexpected PayPal API request.');
    return new Response(JSON.stringify(response.body), {
      status: response.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
  return requests;
}

function paypalHeaders(): Record<string, string> {
  return {
    'paypal-auth-algo': 'SHA256withRSA',
    'paypal-cert-url': 'https://api.paypal.com/cert',
    'paypal-transmission-id': 'test-transmission',
    'paypal-transmission-sig': 'test-signature',
    'paypal-transmission-time': '2026-11-01T10:00:00Z',
  };
}

describe('PayPal payment security', () => {
  it('fails closed on order flows that do not verify PayPal captures', async () => {
    const service = new PaymentsService({} as PrismaService);
    await assert.rejects(service.createOrder(), ServiceUnavailableException);
    await assert.rejects(service.captureOrder(), ServiceUnavailableException);
    await assert.rejects(service.createShopOrder(), ServiceUnavailableException);
    await assert.rejects(service.captureShopOrder(), ServiceUnavailableException);
  });

  it('does not activate a subscription claimed by a different account', async () => {
    configurePayPal();
    mockFetch([
      { body: { access_token: 'test-access-token' } },
      {
        body: {
          id: 'I-SUBSCRIPTION',
          status: 'ACTIVE',
          plan_id: 'P-6JD50850NE6749845NLPPESI',
          custom_id: 'another-user',
        },
      },
    ]);
    const prisma = {
      userPlan: {
        findUnique: async () => null,
        upsert: async () => assert.fail('Must not activate a subscription owned by another user.'),
      },
    } as unknown as PrismaService;
    const service = new PaypalService(prisma);

    await assert.rejects(
      service.verifyAndActivate({ subscriptionID: 'I-SUBSCRIPTION' }, 'current-user'),
      UnauthorizedException,
    );
  });

  it('activates only a PayPal-verified subscription bound to the signed-in user', async () => {
    configurePayPal();
    mockFetch([
      { body: { access_token: 'test-access-token' } },
      {
        body: {
          id: 'I-SUBSCRIPTION',
          status: 'ACTIVE',
          plan_id: 'P-6JD50850NE6749845NLPPESI',
          custom_id: 'current-user',
          billing_info: { next_billing_time: '2026-12-01T00:00:00Z' },
        },
      },
    ]);
    let upsertArgs: Record<string, unknown> | undefined;
    const prisma = {
      userPlan: {
        findUnique: async () => null,
        upsert: async (args: Record<string, unknown>) => {
          upsertArgs = args;
          return { id: 'plan-row', userId: 'current-user' };
        },
      },
    } as unknown as PrismaService;
    const service = new PaypalService(prisma);

    const result = await service.verifyAndActivate(
      { subscriptionID: 'I-SUBSCRIPTION' },
      'current-user',
    );
    assert.equal(result.success, true);
    assert.equal((upsertArgs?.create as { userId: string }).userId, 'current-user');
    assert.equal((upsertArgs?.create as { status: string }).status, 'ACTIVE');
  });

  it('rejects webhook requests when PayPal reports an invalid signature', async () => {
    configurePayPal();
    process.env.PAYPAL_WEBHOOK_ID = 'test-webhook-id';
    const requests = mockFetch([
      { body: { access_token: 'test-access-token' } },
      { body: { verification_status: 'FAILURE' } },
    ]);
    const prisma = {
      userPlan: {
        findUnique: async () => assert.fail('Invalid webhooks must not access subscription records.'),
        update: async () => assert.fail('Invalid webhooks must not update subscription records.'),
      },
    } as unknown as PrismaService;
    const service = new PaypalService(prisma);

    await assert.rejects(
      service.handleWebhookEvent(
        { event_type: 'BILLING.SUBSCRIPTION.CANCELLED', resource: { id: 'I-SUBSCRIPTION' } },
        paypalHeaders(),
      ),
      UnauthorizedException,
    );
    assert.equal(requests.length, 2);
    assert.match(String(requests[1].init?.body), /test-webhook-id/);
  });

  it('rejects webhook events when PayPal signature verification is not configured', async () => {
    configurePayPal();
    delete process.env.PAYPAL_WEBHOOK_ID;
    const service = new PaypalService({} as PrismaService);

    await assert.rejects(
      service.handleWebhookEvent(
        { event_type: 'BILLING.SUBSCRIPTION.CANCELLED', resource: { id: 'I-SUBSCRIPTION' } },
        paypalHeaders(),
      ),
      ServiceUnavailableException,
    );
  });

  it('updates renewal dates from PayPal state so duplicate webhooks are idempotent', async () => {
    configurePayPal();
    process.env.PAYPAL_WEBHOOK_ID = 'test-webhook-id';
    mockFetch([
      { body: { access_token: 'webhook-token' } },
      { body: { verification_status: 'SUCCESS' } },
      { body: { access_token: 'subscription-token' } },
      {
        body: {
          id: 'I-SUBSCRIPTION',
          status: 'ACTIVE',
          plan_id: 'P-6JD50850NE6749845NLPPESI',
          billing_info: { next_billing_time: '2026-12-01T00:00:00Z' },
        },
      },
    ]);
    let updateArgs: Record<string, unknown> | undefined;
    const prisma = {
      userPlan: {
        findUnique: async () => ({ id: 'plan-row', planId: 'starter' }),
        update: async (args: Record<string, unknown>) => {
          updateArgs = args;
          return {};
        },
      },
    } as unknown as PrismaService;
    const service = new PaypalService(prisma);

    const result = await service.handleWebhookEvent(
      { event_type: 'BILLING.SUBSCRIPTION.PAYMENT.COMPLETED', resource: { id: 'I-SUBSCRIPTION' } },
      paypalHeaders(),
    );

    assert.deepEqual(result, { ok: true, renewed: 'I-SUBSCRIPTION' });
    assert.equal(
      (updateArgs?.data as { endDate: Date }).endDate.toISOString(),
      '2026-12-01T00:00:00.000Z',
    );
  });

  it('deactivates a subscription only after a verified cancellation event', async () => {
    configurePayPal();
    process.env.PAYPAL_WEBHOOK_ID = 'test-webhook-id';
    mockFetch([
      { body: { access_token: 'test-access-token' } },
      { body: { verification_status: 'SUCCESS' } },
    ]);
    let updateArgs: Record<string, unknown> | undefined;
    const prisma = {
      userPlan: {
        findUnique: async () => ({ id: 'plan-row' }),
        update: async (args: Record<string, unknown>) => {
          updateArgs = args;
          return {};
        },
      },
    } as unknown as PrismaService;
    const service = new PaypalService(prisma);

    await service.handleWebhookEvent(
      { event_type: 'BILLING.SUBSCRIPTION.CANCELLED', resource: { id: 'I-SUBSCRIPTION' } },
      paypalHeaders(),
    );

    assert.deepEqual(updateArgs?.data, { status: 'CANCELLED', autoRenew: false });
  });
});
