import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getPayPalApiBase, resolvePayPalMode } from '../../src/paypal/paypal-config';

describe('PayPal runtime configuration', () => {
  it('selects only the API endpoint named by PAYPAL_MODE', () => {
    assert.equal(resolvePayPalMode({ PAYPAL_MODE: 'sandbox' }), 'sandbox');
    assert.equal(resolvePayPalMode({ PAYPAL_MODE: 'live' }), 'live');
    assert.equal(getPayPalApiBase('sandbox'), 'https://api-m.sandbox.paypal.com');
    assert.equal(getPayPalApiBase('live'), 'https://api-m.paypal.com');
  });

  it('rejects missing and invalid modes', () => {
    assert.throws(() => resolvePayPalMode({}), /PAYPAL_MODE/);
    assert.throws(() => resolvePayPalMode({ PAYPAL_MODE: 'production' }), /PAYPAL_MODE/);
  });

  it('rejects the legacy mode and credential aliases', () => {
    assert.throws(
      () => resolvePayPalMode({ PAYPAL_MODE: 'sandbox', PAYPAL_ENV: 'live' }),
      /PAYPAL_ENV/,
    );
    assert.throws(
      () => resolvePayPalMode({ PAYPAL_MODE: 'sandbox', PAYPAL_SECRET: 'configured' }),
      /PAYPAL_SECRET/,
    );
  });

  it('rejects mixed or mode-prefixed credential sets', () => {
    assert.throws(
      () => resolvePayPalMode({
        PAYPAL_MODE: 'sandbox',
        PAYPAL_SANDBOX_CLIENT_ID: 'configured',
        PAYPAL_LIVE_CLIENT_ID: 'configured',
      }),
      /cannot coexist/,
    );
    assert.throws(
      () => resolvePayPalMode({ PAYPAL_MODE: 'sandbox', PAYPAL_SANDBOX_CLIENT_ID: 'configured' }),
      /mode-prefixed/,
    );
  });
});
