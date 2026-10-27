import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used by RolesGuard to extract required user roles.
 */
export const ROLES_KEY = 'roles';

/**
 * Restricts endpoint access to specific authorized user groups.
 * @param roles Array of string characters representing permitted roles (e.g., 'SUPER_ADMIN').
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
