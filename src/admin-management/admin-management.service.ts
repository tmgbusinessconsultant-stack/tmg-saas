import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

const ASSIGNABLE_ROLES = new Set<string>([
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN_MANAGER,
  UserRole.CONTENT_MANAGER,
  UserRole.FINANCE_MANAGER,
  UserRole.PROJECT_MANAGER,
  UserRole.STAFF,
  UserRole.CLIENT,
]);

export const ADMIN_PERMISSIONS = [
  'finance:manage',
  'projects:manage',
  'ai:manage',
  'settings:manage',
  'integrations:manage',
] as const;

@Injectable()
export class AdminManagementService {
  constructor(private readonly prisma: PrismaService) {}

  listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      take: 500,
    });
  }

  async updateAccess(
    id: string,
    input: { role?: unknown; permissions?: unknown },
    actor: AuthenticatedUser,
  ) {
    if (id === actor.id) {
      throw new BadRequestException('Use another Super Admin account to change your own access.');
    }
    if (typeof input?.role !== 'string' || !ASSIGNABLE_ROLES.has(input.role)) {
      throw new BadRequestException('Choose a valid user role.');
    }
    if (!Array.isArray(input.permissions) || input.permissions.some(
      (permission) => typeof permission !== 'string' || !ADMIN_PERMISSIONS.includes(permission as typeof ADMIN_PERMISSIONS[number]),
    )) {
      throw new BadRequestException('Choose valid administrative permissions.');
    }
    const role = input.role as UserRole;
    const permissions = [...new Set(input.permissions as string[])];

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { id },
        select: { id: true, role: true, permissions: true, isActive: true },
      });
      if (!existing) throw new NotFoundException('User not found.');
      if (existing.role === UserRole.SUPER_ADMIN && role !== UserRole.SUPER_ADMIN && existing.isActive) {
        const activeSuperAdmins = await tx.user.count({
          where: { role: UserRole.SUPER_ADMIN, isActive: true },
        });
        if (activeSuperAdmins <= 1) {
          throw new ConflictException('At least one active Super Admin account must remain.');
        }
      }

      const updated = await tx.user.update({
        where: { id },
        data: { role, permissions, tokenVersion: { increment: 1 } },
        select: { id: true, name: true, email: true, role: true, permissions: true, isActive: true },
      });
      await tx.activityLog.create({
        data: {
          actorId: actor.id,
          action: 'USER_ACCESS_UPDATED',
          targetId: id,
          detail: {
            oldRole: existing.role,
            newRole: role,
            oldPermissions: existing.permissions,
            newPermissions: permissions,
          } satisfies Prisma.InputJsonValue,
        },
      });
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  listActivity() {
    return this.prisma.activityLog.findMany({
      select: {
        id: true,
        action: true,
        targetId: true,
        detail: true,
        createdAt: true,
        actor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }
}
