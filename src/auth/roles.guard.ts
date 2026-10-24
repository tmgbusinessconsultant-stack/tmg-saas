import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

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
    if (!user) return false;

    if (user.role === 'SUPER_ADMIN') return true;
    if (requiredRoles?.length && !requiredRoles.includes(user.role ?? '')) {
      return false;
    }
    if (requiredPermissions?.length && !requiredPermissions.some((p) => user.permissions?.includes(p))) {
      return false;
    }
    return true;
  }
}