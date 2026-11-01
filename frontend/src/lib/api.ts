export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
export function getToken() { if (typeof window === "undefined") return null; return localStorage.getItem("token"); }
export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {};
  new Headers(options.headers).forEach((value, key) => { headers[key] = value; });
  if (typeof options.body === "string" && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) { const txt = await res.text(); throw new Error(txt); }
  const result: unknown = await res.json();
  return result;
}
