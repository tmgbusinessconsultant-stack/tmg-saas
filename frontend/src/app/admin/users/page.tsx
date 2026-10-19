"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/project-delivery";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
};

const roles = [
  "SUPER_ADMIN",
  "ADMIN_MANAGER",
  "CONTENT_MANAGER",
  "FINANCE_MANAGER",
  "PROJECT_MANAGER",
  "STAFF",
  "CLIENT",
];
const availablePermissions = [
  ["finance:manage", "Manage financial operations"],
  ["projects:manage", "Manage projects"],
  ["ai:manage", "Manage AI tools and conversations"],
  ["settings:manage", "Manage system settings"],
  ["integrations:manage", "Manage integrations"],
] as const;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { role: string; permissions: string[] }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      setError("Sign in with the Super Admin account to manage users.");
      setLoading(false);
      return;
    }
    try {
      const result = await apiRequest<ManagedUser[]>("/admin/users", token);
      setUsers(result);
      setSelectedId((current) => current && result.some((user) => user.id === current) ? current : result[0]?.id ?? "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadUsers(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  const selectedUser = users.find((user) => user.id === selectedId);
  const role = drafts[selectedId]?.role ?? selectedUser?.role ?? "CLIENT";
  const permissions = drafts[selectedId]?.permissions ?? selectedUser?.permissions ?? [];

  async function saveAccess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = sessionStorage.getItem("accessToken");
    if (!token || !selectedId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await apiRequest<ManagedUser>(`/admin/users/${encodeURIComponent(selectedId)}/access`, token, {
        method: "PATCH",
        body: JSON.stringify({ role, permissions }),
      });
      setUsers((current) => current.map((user) => user.id === updated.id ? updated : user));
      setMessage(`Access updated for ${updated.name}. Their existing sessions were revoked.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update access.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Super Admin</p>
      <h1 className="mt-2 text-4xl font-bold">Users &amp; access</h1>
      <p className="mt-3 max-w-3xl text-slate-600">Assign a role and specific capabilities. Website content remains editable only by Super Admin accounts.</p>
      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
      {message && <p className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-800" role="status">{message}</p>}
      {loading ? <p className="mt-8" role="status">Loading users…</p> : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold">Accounts</h2>
            <ul className="mt-4 space-y-2">
              {users.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(user.id)}
                    className={`w-full rounded-lg border p-3 text-left ${selectedId === user.id ? "border-[#D4AF37] bg-[#FFFBEB]" : "border-slate-200"}`}
                  >
                    <span className="block font-semibold">{user.name}</span>
                    <span className="block text-sm text-slate-600">{user.email}</span>
                    <span className="mt-1 block text-xs text-slate-500">{user.role.replaceAll("_", " ")} · {user.isActive ? "Active" : "Suspended"}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <form onSubmit={saveAccess} className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold">Role and permissions</h2>
            {selectedUser ? (
              <>
                <p className="mt-2 text-sm text-slate-600">{selectedUser.name} · {selectedUser.email}</p>
                <label className="mt-5 block text-sm font-medium">
                  Role
                  <select value={role} onChange={(event) => setDrafts((current) => ({
                    ...current,
                    [selectedId]: { role: event.target.value, permissions },
                  }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                    {roles.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
                  </select>
                </label>
                <fieldset className="mt-5 space-y-3">
                  <legend className="font-semibold">Capabilities granted to this account</legend>
                  {availablePermissions.map(([value, label]) => (
                    <label key={value} className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={permissions.includes(value)}
                        onChange={(event) => setDrafts((current) => ({
                          ...current,
                          [selectedId]: {
                            role,
                            permissions: event.target.checked
                              ? [...permissions, value]
                              : permissions.filter((permission) => permission !== value),
                          },
                        }))}
                        className="mt-1"
                      />
                      <span>{label}<span className="block text-xs text-slate-500">{value}</span></span>
                    </label>
                  ))}
                </fieldset>
                <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Content editing routes are enforced server-side for Super Admin only, regardless of assigned capabilities.</p>
                <button type="submit" disabled={saving || !selectedUser.isActive} className="mt-5 rounded-md bg-[#0F172A] px-5 py-3 font-semibold text-white disabled:opacity-50">
                  {saving ? "Saving…" : "Save access"}
                </button>
                {!selectedUser.isActive && <p className="mt-2 text-sm text-red-700">Suspended accounts cannot sign in.</p>}
              </>
            ) : <p className="mt-4 text-slate-600">No accounts found.</p>}
          </form>
        </div>
      )}
    </main>
  );
}
