import { ForbiddenException, Injectable, ServiceUnavailableException } from '@nestjs/common';

type TurnstileResponse = {
  success?: boolean;
  hostname?: string;
  action?: string;
};

@Injectable()
export class TurnstileService {
  async verify(token: string, remoteIp?: string): Promise<void> {
    const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
    const hostnames = (process.env.TURNSTILE_ALLOWED_HOSTNAMES ?? '')
      .split(',')
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean);
    if (!secret || hostnames.length === 0) {
      throw new ServiceUnavailableException('Bot protection is not fully configured.');
    }

    const body = new URLSearchParams({ secret, response: token });
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
      result = await response.json() as TurnstileResponse;
    } catch (error) {
      console.error('Turnstile verification returned invalid JSON.', error);
      throw new ServiceUnavailableException('Bot verification is temporarily unavailable.');
    }
    if (result.success !== true || typeof result.hostname !== 'string' || !hostnames.includes(result.hostname.toLowerCase())) {
      throw new ForbiddenException('Bot verification failed. Please retry the challenge.');
    }
  }
}
