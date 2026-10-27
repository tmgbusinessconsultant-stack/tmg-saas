import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAccessDto } from './dto/update-access.dto';

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
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Advanced Query System featuring status filters, fuzzy text searches, and clean cursor bounds
   */
  async listUsers(filters?: { search?: string; role?: UserRole; isActive?: boolean; take?: number; skip?: number }) {
    const take = Math.min(filters?.take || 100, 500);
    const skip = filters?.skip || 0;

    const whereClause: Prisma.UserWhereInput = {
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters?.role && { role: filters.role }),
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where: whereClause }),
      this.prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          permissions: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
        take,
        skip,
      }),
    ]);

    return { totalRecordsMatched: total, limit: take, offset: skip, users };
  }

  /**
   * Hardened Access Mutator running inside isolation-level safe serializable transactions
   */
  async updateAccess(id: string, input: UpdateAccessDto, actor: AuthenticatedUser) {
    const actorId = actor.id || (actor as any).sub;
    if (id === actorId) {
      throw new BadRequestException('Use another Super Admin account to change your own access parameters.');
    }

    if (input.role && !ASSIGNABLE_ROLES.has(input.role)) {
      throw new BadRequestException('Choose a valid, system-recognized user role.');
    }

    if (input.permissions) {
      const invalidPermission = input.permissions.some(
        (p: any) => !ADMIN_PERMISSIONS.includes(p as typeof ADMIN_PERMISSIONS[number]),
      );
      if (invalidPermission) {
        throw new BadRequestException('Choose valid, authorized administrative permissions.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { id },
        select: { id: true, role: true, permissions: true, isActive: true },
      });
      if (!existing) throw new NotFoundException('User reference record not found on active directories.');

      const targetRole = input.role || existing.role;
      const targetPermissions = input.permissions
        ? [...new Set(input.permissions)]
        : existing.permissions;

      // ENFORCES SINGLE MASTER RECOVERY RULE: Blocks de-elevation if last administrator node
      if (existing.role === UserRole.SUPER_ADMIN && targetRole !== UserRole.SUPER_ADMIN && existing.isActive) {
        const activeSuperAdmins = await tx.user.count({
          where: { role: UserRole.SUPER_ADMIN, isActive: true },
        });
        if (activeSuperAdmins <= 1) {
          throw new ConflictException('Operational Constraint Error: At least one active Super Admin account must remain.');
        }
      }

      const updated = await tx.user.update({
        where: { id },
        // INCREMENT VALUE FORCE RE-DECODES EXISTING SESSIONPrivileges ON DOWMSTREAM TERMINALS
        data: { role: targetRole, permissions: targetPermissions, tokenVersion: { increment: 1 } },
        select: { id: true, name: true, email: true, role: true, permissions: true, isActive: true },
      });

      await tx.activityLog.create({
        data: {
          actorId,
          action: 'USER_ACCESS_UPDATED',
          targetId: id,
          detail: {
            oldRole: existing.role,
            newRole: targetRole,
            oldPermissions: existing.permissions,
            newPermissions: targetPermissions,
          } satisfies Prisma.InputJsonValue,
        },
      });

      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  /**
   * NEW FEATURE: Global Ban & Account Status Suspension Vector
   */
  async toggleUserStatus(id: string, activeState: boolean, actor: AuthenticatedUser) {
    const actorId = actor.id || (actor as any).sub;
    if (id === actorId) {
      throw new BadRequestException('Self deactivation actions are strictly unauthorized on this endpoint context.');
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { id },
        select: { id: true, role: true, isActive: true },
      });
      if (!existing) throw new NotFoundException('Target user profile not located.');

      if (existing.role === UserRole.SUPER_ADMIN && !activeState) {
        const activeSuperAdmins = await tx.user.count({
          where: { role: UserRole.SUPER_ADMIN, isActive: true },
        });
        if (activeSuperAdmins <= 1) {
          throw new ConflictException('Cannot lock out or suspend the single remaining operational super administrator.');
        }
      }

      const updated = await tx.user.update({
        where: { id },
        // Increment tokenVersion to kill any active cookie/header sessions instantly if banned
        data: { isActive: activeState, tokenVersion: { increment: 1 } },
        select: { id: true, email: true, isActive: true },
      });

      await tx.activityLog.create({
        data: {
          actorId,
          action: activeState ? 'USER_ACCOUNT_REACTIVATED' : 'USER_ACCOUNT_SUSPENDED',
          targetId: id,
          detail: { executionStatus: activeState, affectedId: id } satisfies Prisma.InputJsonValue,
        },
      });

      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  /**
   * System Activity Tracking Streams Mapping Query Lookups
   */
  async listActivity(filters?: { action?: string; take?: number; skip?: number }) {
    const take = Math.min(filters?.take || 100, 500);
    const skip = filters?.skip || 0;

    const whereClause: Prisma.ActivityLogWhereInput = {
      ...(filters?.action && { action: filters.action }),
    };

    const [total, logs] = await Promise.all([
      this.prisma.activityLog.count({ where: whereClause }),
      this.prisma.activityLog.findMany({
        where: whereClause,
        select: {
          id: true,
          action: true,
          targetId: true,
          detail: true,
          createdAt: true,
          User: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
    ]);

    return { totalActivityLogs: total, limit: take, offset: skip, logs };
  }
}

