function normalizeApiBase(value: string): string {
  const url = new URL(value, 'http://localhost:4000');
  if (url.hostname === 'localhost' && !url.port) url.port = '4000';
  const path = url.pathname.replace(/\/+$/, '');
  url.pathname = path.toLowerCase().endsWith('/api') ? path : `${path}/api`;
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/+$/, '');
}

export function getBackendApiBase(): string {
  return normalizeApiBase(
    process.env.BACKEND_URL
      || process.env.NEXT_PUBLIC_API_URL
      || 'http://localhost:4000/api',
  );
}

export function getPublicApiBase(): string {
  return normalizeApiBase(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');
}
