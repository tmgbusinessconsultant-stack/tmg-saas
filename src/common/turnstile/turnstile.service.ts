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
    if (!secret) {
      throw new ServiceUnavailableException('Bot protection is not fully configured: TURNSTILE_SECRET_KEY missing.');
    }
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
    } catch {
      throw new ServiceUnavailableException('Bot verification is temporarily unavailable.');
    }

    if (!response.ok) {
      throw new ServiceUnavailableException('Bot verification is temporarily unavailable.');
    }

    const result = (await response.json()) as TurnstileResponse;

    if (result.success !== true) {
      throw new ForbiddenException(`Bot verification failed: ${result['error-codes']?.join(',') || 'failed'}`);
    }

    const allowed = (process.env.TURNSTILE_ALLOWED_HOSTNAMES ?? '').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
    if (allowed.length > 0 && result.hostname && !allowed.includes(result.hostname.toLowerCase())) {
      throw new ForbiddenException('Bot verification failed. Invalid hostname.');
    }

    if (expectedAction && result.action && result.action !== expectedAction) {
      throw new ForbiddenException('Bot verification failed. Invalid action.');
    }
  }
}
