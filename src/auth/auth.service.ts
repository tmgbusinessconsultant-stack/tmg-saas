import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, type User, AuthTokenType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { authenticator } from 'otplib';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 12;
const DUMMY_PASSWORD_HASH = '$2a$12$CiHVjBfb5uMTQ78KfIRus.KhqpFkezJ3PI2iI/g.ChD3gWGme2d76';
const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const MFA_CHALLENGE_TTL_MS = 10 * 60 * 1000;

export type AuthenticatedUser = Pick<User, 'id' | 'email' | 'name' | 'role' | 'permissions'> & {
  emailVerified: boolean;
  mfaEnabled: boolean;
};

type AuthResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthenticatedUser;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    this.validatePasswordBytes(dto.password);
    const email = dto.email.trim().toLowerCase();
    const name = dto.name.trim();
    if (name.length < 2) throw new BadRequestException('Name must be at least 2 characters.');

    try {
      const user = await this.createUser({ email, name, password: dto.password });
      await this.issueEmailVerification(user.id, user.email, true);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { message: 'If registration can be completed, verify your email to sign in.' };
      }
      throw error;
    }

    return { message: 'If registration can be completed, verify your email to sign in.' };
  }

  async login(dto: LoginDto): Promise<AuthResponse | { requiresMfa: true; challengeToken: string; expiresIn: number }> {
    this.validatePasswordBytes(dto.password);
    const email = dto.email.trim().toLowerCase();
    const user = await this.findUserByEmail(email);
    const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const passwordMatches = await bcrypt.compare(dto.password, passwordHash);

    if (!user || !passwordMatches || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    if (!user.emailVerified) {
      throw new ForbiddenException('Please verify your email address before signing in.');
    }
    if (user.mfaEnabled && user.mfaSecret) {
      const challengeToken = await this.createAuthToken(user.id, AuthTokenType.MFA_LOGIN, MFA_CHALLENGE_TTL_MS);
      return { requiresMfa: true, challengeToken, expiresIn: Math.floor(MFA_CHALLENGE_TTL_MS / 1000) };
    }
    return this.createAuthResponse(user);
  }

  async verifyMfaLogin(challengeToken: string, code: string): Promise<AuthResponse> {
    const token = await this.consumeAuthToken(challengeToken, AuthTokenType.MFA_LOGIN);
    const user = await this.prisma.user.findUnique({ where: { id: token.userId } });
    if (!user || !user.isActive || !user.mfaEnabled || !user.mfaSecret) {
      throw new UnauthorizedException('Invalid or expired MFA challenge.');
    }
    const ok = authenticator.check(code, user.mfaSecret);
    if (!ok) throw new UnauthorizedException('Invalid authentication code.');
    return this.createAuthResponse(user);
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.findUserByEmail(email.trim().toLowerCase());
    if (user && !user.emailVerified) {
      await this.issueEmailVerification(user.id, user.email, false);
    }
    return { message: 'If an unverified account exists for this email, a verification link has been sent.' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const record = await this.consumeAuthToken(token, AuthTokenType.EMAIL_VERIFICATION);
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    });
    return { message: 'Email verified successfully. You can now sign in.' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.findUserByEmail(email.trim().toLowerCase());
    if (user && user.isActive) {
      await this.issuePasswordReset(user.id, user.email);
    }
    return { message: 'If an account exists for this email, a password reset link has been sent.' };
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    this.validatePasswordBytes(password);
    if (password.length < 12) throw new BadRequestException('Password must be at least 12 characters.');
    const record = await this.consumeAuthToken(token, AuthTokenType.PASSWORD_RESET);
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        tokenVersion: { increment: 1 },
      },
    });
    return { message: 'Password reset successfully. Please sign in with your new password.' };
  }

  async startMfaSetup(userId: string): Promise<{ secret: string; otpauthUrl: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const secret = authenticator.generateSecret();
    await this.prisma.user.update({ where: { id: userId }, data: { mfaPendingSecret: secret } });
    const otpauthUrl = authenticator.keyuri(user.email, 'TMG Business Consulting', secret);
    return { secret, otpauthUrl };
  }

  async confirmMfaSetup(userId: string, code: string): Promise<{ message: string; mfaEnabled: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaPendingSecret) throw new BadRequestException('No MFA setup in progress.');
    const ok = authenticator.check(code, user.mfaPendingSecret);
    if (!ok) throw new BadRequestException('Invalid authentication code.');
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: user.mfaPendingSecret, mfaPendingSecret: null, mfaEnabled: true, tokenVersion: { increment: 1 } },
    });
    return { message: 'Multi-factor authentication enabled.', mfaEnabled: true };
  }

  async disableMfa(userId: string): Promise<{ message: string; mfaEnabled: boolean }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: null, mfaPendingSecret: null, mfaEnabled: false, tokenVersion: { increment: 1 } },
    });
    return { message: 'Multi-factor authentication disabled.', mfaEnabled: false };
  }

  async getUserForToken(userId: string, tokenVersion: number): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        isActive: true,
        tokenVersion: true,
        emailVerified: true,
        mfaEnabled: true,
      },
    });
    if (!user || !user.isActive || user.tokenVersion !== tokenVersion) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
    };
  }

  async logout(userId: string): Promise<{ success: true }> {
    await this.incrementTokenVersion(userId);
    return { success: true };
  }

  private validatePasswordBytes(password: string): void {
    if (!password) throw new BadRequestException('Password is required.');
    if (Buffer.byteLength(password, 'utf8') > 72) {
      throw new BadRequestException('Password must not exceed 72 UTF-8 bytes.');
    }
  }

  private async createUser(input: { email: string; name: string; password: string }) {
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    return this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        role: UserRole.CLIENT,
        permissions: ['projects:create', 'projects:read', 'projects:update'],
        emailVerified: false,
      },
    });
  }

  private findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  private incrementTokenVersion(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  private createAuthResponse(user: User): AuthResponse {
    const safeUser = this.toAuthenticatedUser(user);
    const accessToken = this.jwtService.sign({
      sub: user.id,
      tokenVersion: user.tokenVersion,
    });

    return { accessToken, tokenType: 'Bearer', expiresIn: 900, user: safeUser };
  }

  private toAuthenticatedUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      emailVerified: (user as any).emailVerified ?? true,
      mfaEnabled: (user as any).mfaEnabled ?? false,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private frontendBase(): string {
    return (process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
  }

  private async createAuthToken(userId: string, type: AuthTokenType, ttlMs: number): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    await this.prisma.authToken.deleteMany({ where: { userId, type } });
    await this.prisma.authToken.create({
      data: { userId, type, tokenHash, expiresAt: new Date(Date.now() + ttlMs) },
    });
    return token;
  }

  private async consumeAuthToken(token: string, type: AuthTokenType) {
    const tokenHash = this.hashToken(token);
    const record = await this.prisma.authToken.findFirst({
      where: { tokenHash, type, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!record) throw new BadRequestException('Invalid or expired token.');
    await this.prisma.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    return record;
  }

  private async issueEmailVerification(userId: string, email: string, isNew: boolean): Promise<void> {
    const token = await this.createAuthToken(userId, AuthTokenType.EMAIL_VERIFICATION, EMAIL_VERIFY_TTL_MS);
    const url = `${this.frontendBase()}/verify-email?token=${encodeURIComponent(token)}`;
    await this.mail.send(
      email,
      'Verify your email - TMG Business Consulting',
      `Please verify your email address by opening this link: ${url}\nThis link expires in 24 hours.`,
      `<p>Please verify your email address by clicking the link below:</p><p><a href="${url}">Verify email</a></p><p>This link expires in 24 hours.</p>`,
    );
    if (isNew) this.mail['logger']?.log?.(`Verification email issued for ${email}`);
  }

  private async issuePasswordReset(userId: string, email: string): Promise<void> {
    const token = await this.createAuthToken(userId, AuthTokenType.PASSWORD_RESET, PASSWORD_RESET_TTL_MS);
    const url = `${this.frontendBase()}/reset-password?token=${encodeURIComponent(token)}`;
    await this.mail.send(
      email,
      'Reset your password - TMG Business Consulting',
      `Reset your password using this link: ${url}\nThis link expires in 1 hour. If you did not request this, you can ignore this email.`,
      `<p>Reset your password using the link below:</p><p><a href="${url}">Reset password</a></p><p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>`,
    );
  }
  // === FACEBOOK / SOCIAL LOGIN - PROPER WAY ===
  async loginWithSocial(input: { email: string; name: string; provider: string; providerId: string }): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim() || email.split('@')[0];
    let user = await this.findUserByEmail(email);
    if (!user) {
      const randomHash = await bcrypt.hash(randomBytes(32).toString('hex'), BCRYPT_ROUNDS);
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          passwordHash: randomHash,
          role: UserRole.CLIENT,
          permissions: ['projects:create', 'projects:read', 'projects:update'],
          emailVerified: true,
          emailVerifiedAt: new Date(),
          isActive: true,
        },
      });
    } else {
      if (!user.emailVerified || !user.isActive) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: true, emailVerifiedAt: new Date(), isActive: true },
        });
      }
      if (!user.isActive) throw new ForbiddenException('Account is deactivated.');
    }
    return this.createAuthResponse(user);
  }
}


