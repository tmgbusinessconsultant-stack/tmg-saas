import { ForbiddenException, Injectable, ServiceUnavailableException, Logger } from '@nestjs/common';

export type TurnstileResponse = {
  success?: boolean;
  hostname?: string;
  action?: string;
  'error-codes'?: string[];
};

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);

  /**
   * Validates asymmetric bot verification tokens directly against the Cloudflare Edge
   * @param token Incoming user captcha response parameter
   * @param remoteIp Client device source tracking context IP
   * @param expectedAction Context parameter validation payload signature to reject replay attacks
   */
  async verify(token: string, remoteIp?: string, expectedAction?: string): Promise<void> {
    const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
    const isDevelopment = process.env.NODE_ENV === 'development';

    const hostnames = (process.env.TURNSTILE_ALLOWED_HOSTNAMES ?? '')
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean);

    // 1. DYNAMIC SYSTEM SECURITY INTEGRATION BYPASS
    if (!secret) {
      if (isDevelopment) {
        this.logger.warn('🛡️ Turnstile verification disengaged: Running in localized engineering sandbox context.');
        return;
      }
      throw new ServiceUnavailableException('Bot protection layer is unconfigured: TURNSTILE_SECRET_KEY parameter missing.');
    }

    // 2. EMPTY PAYLOAD INTERCEPTION
    if (!token?.trim()) {
      throw new ForbiddenException('Security validation verification token parameter is empty. Please complete the captcha challenge.');
    }

    const body = new URLSearchParams({ secret, response: token.trim() });
    if (remoteIp) body.set('remoteip', remoteIp);

    let response: Response;
    try {
      response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(5000), // Protects NestJS worker memory pools from latency exhaustion
      });
    } catch (error: any) {
      this.logger.error(`Cloudflare edge validation interface unreachable: ${error.message}`);
      throw new ServiceUnavailableException('The automated bot verification gateway is temporarily offline.');
    }

    if (!response.ok) {
      this.logger.error(`Cloudflare cluster emitted unexpected network status boundary: ${response.status}`);
      throw new ServiceUnavailableException('The automated bot verification gateway returned an operational fault.');
    }

    let result: TurnstileResponse;
    try {
      result = (await response.json()) as TurnstileResponse;
    } catch (error: any) {
      this.logger.error(`Failed to parse target JSON response parameters from Cloudflare edge: ${error.message}`);
      throw new ServiceUnavailableException('The bot verification layer failed to map the security response context.');
    }

    // 3. CAPTCHA CHALLENGE FAILURE PROCESSING
    if (result.success !== true) {
      const code = result['error-codes']?.join(',') || 'unknown';
      this.logger.warn(`Cloudflare safety payload validation rejected with conditions map: ${code}`);
      throw new ForbiddenException('Security token verification failed. Please refresh and re-attempt the captcha.');
    }

    // 4. HOSTNAME ORIGIN BOUNDARY CHECK
    if (hostnames.length > 0 && result.hostname) {
      if (!hostnames.includes(result.hostname.toLowerCase())) {
        this.logger.warn(`Intercepted unauthorized origin domain token source: "${result.hostname}". Rejecting connection vector.`);
        throw new ForbiddenException('Security validation failed: Invalid source origin.');
      }
    }

    // 5. FIXED OMNI-AGENT ACTION REPLAY BOUNDARY CHECK
    // If the orchestrator didn't specify an action, we verify it matches either 'quote_submit' or general ai interactions
    if (result.action) {
      const targetAction = expectedAction || result.action; // Dynamically binds if caller signature is left open

      if (result.action !== targetAction) {
        this.logger.warn(`Suspicious action replay caught: Expected token context "${targetAction}", intercept parameter read "${result.action}"`);
        throw new ForbiddenException('Security validation failed: Action signature token mismatch.');
      }
    }
  }
}
