import { ForbiddenException, Injectable, ServiceUnavailableException, Logger } from '@nestjs/common';

type TurnstileResponse = {
  success?: boolean;
  hostname?: string;
  action?: string;
  'error-codes'?: string[];
};

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);

  async verify(token: string, remoteIp?: string, expectedAction = 'quote_submit'): Promise<void> {
    const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
    const isDevelopment = process.env.NODE_ENV === 'development';

    const hostnames = (process.env.TURNSTILE_ALLOWED_HOSTNAMES ?? '')
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean);

    // Dynamic bypass prevents local engineering environments from breaking if keys are unset
    if (!secret) {
      if (isDevelopment) {
        this.logger.warn('Turnstile disengaged: TURNSTILE_SECRET_KEY missing in development environment.');
        return;
      }
      throw new ServiceUnavailableException('Bot protection is not fully configured: TURNSTILE_SECRET_KEY missing.');
    }

    if (!token?.trim()) {
      throw new ForbiddenException('Missing security validation token. Please complete the captcha verification challenge.');
    }

    const body = new URLSearchParams({ secret, response: token.trim() });
    if (remoteIp) body.set('remoteip', remoteIp);

    let response: Response;
    try {
      response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(5000), // Enforces clean process execution limits on Render containers
      });
    } catch (error) {
      this.logger.error('Turnstile verification could not reach Cloudflare verification grid endpoints.', error);
      throw new ServiceUnavailableException('Bot verification service is temporarily unavailable.');
    }

    if (!response.ok) {
      this.logger.error(`Turnstile validation engine emitted unexpected response status code: ${response.status}`);
      throw new ServiceUnavailableException('Bot verification service is temporarily unavailable.');
    }

    let result: TurnstileResponse;
    try {
      result = (await response.json()) as TurnstileResponse;
    } catch (error) {
      this.logger.error('Turnstile validation endpoint returned invalid JSON formatting properties.', error);
      throw new ServiceUnavailableException('Bot verification service is temporarily unavailable.');
    }

    if (result.success !== true) {
      const code = result['error-codes']?.join(',') || 'unknown';
      this.logger.warn(`Turnstile validation request failed with error conditions code context: ${code}`);
      throw new ForbiddenException('Bot verification challenge failed. Please re-attempt the captcha.');
    }

    // Hostname check: restricts processing strictly to your domain configuration bounds
    if (hostnames.length > 0 && result.hostname) {
      if (!hostnames.includes(result.hostname.toLowerCase())) {
        this.logger.warn(`Blocked unexpected hostname token source: ${result.hostname} not found inside allowed matrix fields: ${hostnames.join(',')}`);
        throw new ForbiddenException('Bot verification challenge failed. Invalid origin domain hostname.');
      }
    }

    // Action check: critical defense parameter blocks request interception and replay attacks
    if (expectedAction && result.action && result.action !== expectedAction) {
      this.logger.warn(`Blocked suspicious action context replay: expected matching action token "${expectedAction}", intercept parameter caught "${result.action}"`);
      throw new ForbiddenException('Bot verification challenge failed. Invalid action parameters signature context.');
    }
  }
}
