import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { getJwtSecret } from './jwt-secret';

interface JwtPayload {
  sub: string;
  tokenVersion: number;
  iat: number;
  exp: number;
  iss: string;
  aud: string | string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: getJwtSecret(),
      algorithms: ['HS256'],
      issuer: 'tmg-business-consultant',
      audience: 'tmg-business-api',
    });
  }

  async validate(payload: JwtPayload) {
    // FIXED: Safely resolves audience checks if passed as an array or collection matrix
    const hasValidAudience = Array.isArray(payload?.aud)
      ? payload.aud.includes('tmg-business-api')
      : payload?.aud === 'tmg-business-api';

    if (
      typeof payload?.sub !== 'string' ||
      !Number.isInteger(payload.tokenVersion) ||
      payload.iss !== 'tmg-business-consultant' ||
      !hasValidAudience
    ) {
      throw new UnauthorizedException('Invalid authentication token structure.');
    }

    // Retransmits validation queries to the core stateful database counter block
    const user = await this.authService.getUserForToken(payload.sub, payload.tokenVersion);
    if (!user) {
      throw new UnauthorizedException('This account is inactive or the session has expired globally.');
    }

    // Returns sanitized data context containing role and permission attributes cleanly onto request.user
    return user;
  }
}
