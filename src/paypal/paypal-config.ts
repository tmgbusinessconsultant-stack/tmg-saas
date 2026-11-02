export type PayPalMode = 'sandbox' | 'live';

export function resolvePayPalMode(env: NodeJS.ProcessEnv = process.env): PayPalMode {
  const legacyMode = env.PAYPAL_ENV?.trim();
  if (legacyMode) {
    throw new Error('PAYPAL_ENV is no longer supported. Remove it and configure PAYPAL_MODE only.');
  }

  const sandboxKeys = Object.keys(env).filter((key) => key.startsWith('PAYPAL_SANDBOX_'));
  const liveKeys = Object.keys(env).filter((key) => key.startsWith('PAYPAL_LIVE_'));
  if (sandboxKeys.length > 0 && liveKeys.length > 0) {
    throw new Error('Configure one PayPal credential set only; PAYPAL_SANDBOX_* and PAYPAL_LIVE_* cannot coexist.');
  }
  if (sandboxKeys.length > 0 || liveKeys.length > 0) {
    throw new Error('Use PAYPAL_MODE with PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET; mode-prefixed PayPal variables are unsupported.');
  }
  if (env.PAYPAL_SECRET?.trim()) {
    throw new Error('PAYPAL_SECRET is no longer supported. Configure PAYPAL_CLIENT_SECRET only.');
  }

  const mode = env.PAYPAL_MODE?.trim();
  if (mode !== 'sandbox' && mode !== 'live') {
    throw new Error('Set PAYPAL_MODE to sandbox or live.');
  }
  return mode;
}

export function getPayPalApiBase(mode: PayPalMode): string {
  return mode === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
}
