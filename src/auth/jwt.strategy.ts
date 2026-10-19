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
    if (
      typeof payload?.sub !== 'string' ||
      !Number.isInteger(payload.tokenVersion) ||
      payload.iss !== 'tmg-business-consultant' ||
      payload.aud !== 'tmg-business-api'
    ) {
      throw new UnauthorizedException('Invalid authentication token.');
    }

    const user = await this.authService.getUserForToken(payload.sub, payload.tokenVersion);
    if (!user) {
      throw new UnauthorizedException('This account is inactive or the session has expired.');
    }

    return user;
  }
}
