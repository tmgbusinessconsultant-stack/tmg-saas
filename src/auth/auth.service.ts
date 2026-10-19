import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserRole } from '@prisma/client';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 12;
const DUMMY_PASSWORD_HASH = '$2a$12$CiHVjBfb5uMTQ78KfIRus.KhqpFkezJ3PI2iI/g.ChD3gWGme2d76';

export type AuthenticatedUser = Pick<User, 'id' | 'email' | 'name' | 'role' | 'permissions'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    this.validatePasswordBytes(dto.password);
    const email = dto.email.trim().toLowerCase();

    try {
      await this.createUser({
        email,
        name: dto.name.trim(),
        password: dto.password,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { message: 'If registration can be completed, you can sign in with those credentials.' };
      }
      throw error;
    }

    return { message: 'If registration can be completed, you can sign in with those credentials.' };
  }

  async login(dto: LoginDto) {
    this.validatePasswordBytes(dto.password);
    const email = dto.email.trim().toLowerCase();
    const user = await this.findUserByEmail(email);
    const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const passwordMatches = await bcrypt.compare(dto.password, passwordHash);

    if (!user || !passwordMatches || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.createAuthResponse(user);
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
    };
  }

  async logout(userId: string): Promise<{ success: true }> {
    await this.incrementTokenVersion(userId);
    return { success: true };
  }

  private validatePasswordBytes(password: string): void {
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
        permissions: [],
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

  private createAuthResponse(user: User) {
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
    };
  }
}
