import { ForbiddenException, Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length && !requiredPermissions?.length) return true;

    const request = context.switchToHttp().getRequest<{
      user?: { role?: string; permissions?: string[] };
    }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('You do not have permission to access this resource.');
    }

    if (user.role === 'SUPER_ADMIN') return true;
    if (requiredRoles?.length && !requiredRoles.includes(user.role ?? '')) {
      throw new ForbiddenException('You do not have permission to access this resource.');
    }
    if (requiredPermissions?.length && !requiredPermissions.some((permission) => user.permissions?.includes(permission))) {
      throw new ForbiddenException('You do not have permission to access this resource.');
    }
    if (requiredPermissions?.includes('content:edit')) {
      throw new ForbiddenException('Only the Super Admin can modify website content.');
    }

    return true;
  }
}
