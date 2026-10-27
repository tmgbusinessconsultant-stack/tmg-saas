import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used by RolesGuard to extract precise client capabilities.
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Restricts endpoint access based on granular permission matrices.
 * @param permissions String tokens defining explicit capabilities (e.g., 'documents:read_all').
 */
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
