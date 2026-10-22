import { ForbiddenException, Injectable, ServiceUnavailableException } from '@nestjs/common';

type TurnstileResponse = {
  success?: boolean;
  hostname?: string;
  action?: string;
  'error-codes'?: string[];
};

@Injectable()
export class TurnstileService {
  async verify(token: string, remoteIp?: string, expectedAction = 'quote_submit'): Promise<void> {
    const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
    const hostnames = (process.env.TURNSTILE_ALLOWED_HOSTNAMES ?? '')
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean);

    if (!secret) {
      throw new ServiceUnavailableException('Bot protection is not fully configured: TURNSTILE_SECRET_KEY missing.');
    }
    // For dev, allow empty hostname list but warn — production must have hostnames
    if (!token?.trim()) {
      throw new ForbiddenException('Missing Turnstile token. Please complete the challenge.');
    }

    const body = new URLSearchParams({ secret, response: token.trim() });
    if (remoteIp) body.set('remoteip', remoteIp);

    let response: Response;
    try {
      response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(5000),
      });
    } catch (error) {
      console.error('Turnstile verification could not reach Cloudflare.', error);
      throw new ServiceUnavailableException('Bot verification is temporarily unavailable.');
    }

    if (!response.ok) {
      console.error('Turnstile verification returned status', response.status);
      throw new ServiceUnavailableException('Bot verification is temporarily unavailable.');
    }

    let result: TurnstileResponse;
    try {
      result = (await response.json()) as TurnstileResponse;
    } catch (error) {
      console.error('Turnstile verification returned invalid JSON.', error);
      throw new ServiceUnavailableException('Bot verification is temporarily unavailable.');
    }

    if (result.success !== true) {
      const code = result['error-codes']?.join(',') || 'unknown';
      // timeout-or-duplicate means replay attack or expired token — must get new token
      console.warn('Turnstile failed:', code);
      throw new ForbiddenException('Bot verification failed. Please retry the challenge.');
    }

    // Hostname check: only if you configured them
    if (hostnames.length > 0 && result.hostname) {
      if (!hostnames.includes(result.hostname.toLowerCase())) {
        console.warn(`Blocked hostname: ${result.hostname} not in ${hostnames.join(',')}`);
        throw new ForbiddenException('Bot verification failed. Invalid hostname.');
      }
    }

    // Action check: critical for Spin validation
    if (expectedAction && result.action && result.action !== expectedAction) {
      console.warn(`Blocked action: expected ${expectedAction}, got ${result.action}`);
      throw new ForbiddenException('Bot verification failed. Invalid action.');
    }
  }
}