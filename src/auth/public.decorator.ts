import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used globally to flag endpoints that do not require authentication headers.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Bypasses token validation sequences and access control guards on open endpoints.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
