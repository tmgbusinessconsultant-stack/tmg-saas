export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret && Buffer.byteLength(secret, 'utf8') >= 32) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must contain at least 32 characters in production.');
  }

  return 'local-only-development-secret-not-for-production';
}
