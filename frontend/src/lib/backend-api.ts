export function getApiBase(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").trim().replace(/\/+$/, "");
  return raw.replace(/\/api$/i, "") + "/api";
}
export function apiUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (clean.startsWith("/api/") || clean === "/api") {
    const base = getApiBase().replace(/\/api$/, "");
    return `${base}${clean}`;
  }
  return `${getApiBase()}${clean}`;
}
export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return fetch(apiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

// Aliases - older files import these names, same logic as getApiBase()
export const getBackendApiBase = getApiBase;
export const getPublicApiBase = getApiBase;
