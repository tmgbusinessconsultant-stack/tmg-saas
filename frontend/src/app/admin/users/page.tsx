"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [search, setSearch] = useState("");

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

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const s = search.toLowerCase();
    return users.filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.role.toLowerCase().includes(s));
  }, [users, search]);

  const selectedUser = users.find((user) => user.id === selectedId);
  const role = drafts[selectedId]?.role ?? selectedUser?.role ?? "CLIENT";
  const permissions = drafts[selectedId]?.permissions ?? selectedUser?.permissions ?? [];

  async function saveAccess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = sessionStorage.getItem("accessToken");
    if (!token || !selectedId) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const updated = await apiRequest<ManagedUser>(`/admin/users/${encodeURIComponent(selectedId)}/access`, token, {
        method: "PATCH",
        body: JSON.stringify({ role, permissions }),
      });
      setUsers((current) => current.map((user) => user.id === updated.id ? updated : user));
      setDrafts((c) => { const n = { ...c }; delete n[selectedId]; return n; });
      setMessage(`Access updated for ${updated.name}. Sessions revoked.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update access.");
    } finally { setSaving(false); }
  }

  async function toggleActive() {
    if (!selectedUser) return;
    const token = sessionStorage.getItem("accessToken");
    if (!token) return;
    if (!window.confirm(`${selectedUser.isActive ? "Suspend" : "Activate"} ${selectedUser.email}?`)) return;
    setSaving(true); setError("");
    try {
      const updated = await apiRequest<ManagedUser>(`/admin/users/${encodeURIComponent(selectedUser.id)}/status`, token, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !selectedUser.isActive }),
      });
      setUsers((c) => c.map(u => u.id === updated.id ? updated : u));
      setMessage(updated.isActive ? "User activated" : "User suspended");
    } catch (e: any) {
      // fallback if backend uses /admin/users/:id/access with isActive
      try {
        const updated = await apiRequest<ManagedUser>(`/admin/users/${encodeURIComponent(selectedUser.id)}/access`, token, {
          method: "PATCH",
          body: JSON.stringify({ role: selectedUser.role, permissions: selectedUser.permissions, isActive: !selectedUser.isActive }),
        });
        setUsers((c) => c.map(u => u.id === updated.id ? updated : u));
        setMessage("Status updated");
      } catch (err: any) { setError(e.message || err.message); }
    } finally { setSaving(false); }
  }

  async function deleteUser() {
    if (!selectedUser) return;
    const token = sessionStorage.getItem("accessToken");
    if (!token) return;
    if (!window.confirm(`PERMANENTLY DELETE ${selectedUser.name} (${selectedUser.email})? This cannot be undone.`)) return;
    const confirmEmail = window.prompt(`Type email to confirm deletion: ${selectedUser.email}`);
    if (confirmEmail !== selectedUser.email) { alert("Email mismatch"); return; }
    setSaving(true); setError("");
    try {
      await apiRequest(`/admin/users/${encodeURIComponent(selectedUser.id)}`, token, { method: "DELETE" });
      setUsers((c) => c.filter(u => u.id !== selectedUser.id));
      setSelectedId(""); setMessage("User deleted");
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Super Admin</p>
      <h1 className="mt-2 text-4xl font-bold">Users & access</h1>
      <p className="mt-3 max-w-3xl text-slate-600">Assign roles, capabilities, suspend or delete accounts. Content routes remain Super Admin only.</p>

      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
      {message && <p className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-800" role="status">{message}</p>}

      {loading ? <p className="mt-8">Loading users…</p> : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <section className="rounded-xl border bg-white p-5">
            <h2 className="text-xl font-semibold">Accounts ({filteredUsers.length})</h2>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, role..." className="mt-3 w-full rounded-md border px-3 py-2 text-sm" />
            <ul className="mt-4 space-y-2 max-h-[600px] overflow-y-auto">
              {filteredUsers.map((user) => (
                <li key={user.id}>
                  <button type="button" onClick={() => setSelectedId(user.id)} className={`w-full rounded-lg border p-3 text-left ${selectedId === user.id ? "border-[#D4AF37] bg-[#FFFBEB]" : "border-slate-200"} ${!user.isActive ? "opacity-60" : ""}`}>
                    <span className="block font-semibold">{user.name} {user.role.includes("SUPER") && "👑"}</span>
                    <span className="block text-sm text-slate-600">{user.email}</span>
                    <span className="mt-1 block text-xs"><span className={`px-2 py-0.5 rounded-full ${user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{user.isActive ? "Active" : "Suspended"}</span> <span className="text-slate-500 ml-1">{user.role.replaceAll("_", " ")}</span></span>
                  </button>
                </li>
              ))}
              {filteredUsers.length === 0 && <li className="text-sm text-slate-500 p-3">No users found</li>}
            </ul>
          </section>

          <form onSubmit={saveAccess} className="rounded-xl border bg-white p-5">
            <h2 className="text-xl font-semibold">Role and permissions</h2>
            {selectedUser ? (
              <>
                <p className="mt-2 text-sm text-slate-600">{selectedUser.name} · {selectedUser.email} · Joined {new Date(selectedUser.createdAt).toLocaleDateString()}</p>

                <label className="mt-5 block text-sm font-medium">Role
                  <select value={role} onChange={(e) => setDrafts((c) => ({ ...c, [selectedId]: { role: e.target.value, permissions } }))} className="mt-1 w-full rounded-md border px-3 py-2">
                    {roles.map((v) => <option key={v} value={v}>{v.replaceAll("_", " ")}</option>)}
                  </select>
                </label>

                <fieldset className="mt-5 space-y-3">
                  <legend className="font-semibold">Capabilities</legend>
                  {availablePermissions.map(([value, label]) => (
                    <label key={value} className="flex items-start gap-3 text-sm">
                      <input type="checkbox" checked={permissions.includes(value)} onChange={(e) => setDrafts((c) => ({ ...c, [selectedId]: { role, permissions: e.target.checked ? [...permissions, value] : permissions.filter(p => p !== value) } }))} className="mt-1" />
                      <span>{label}<span className="block text-xs text-slate-500">{value}</span></span>
                    </label>
                  ))}
                </fieldset>

                <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Content editing routes are enforced server-side for Super Admin only.</p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="submit" disabled={saving} className="rounded-md bg-[#0F172A] px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save access"}</button>
                  <button type="button" onClick={toggleActive} disabled={saving} className={`rounded-md px-5 py-3 font-semibold border ${selectedUser.isActive ? "border-red-300 text-red-700 bg-red-50" : "border-green-300 text-green-700 bg-green-50"}`}>{selectedUser.isActive ? "Suspend" : "Activate"}</button>
                  <button type="button" onClick={deleteUser} disabled={saving} className="rounded-md border border-red-600 px-5 py-3 font-semibold text-red-600 bg-white">Delete User</button>
                </div>
                {!selectedUser.isActive && <p className="mt-2 text-sm text-red-700">Suspended accounts cannot sign in.</p>}
              </>
            ) : <p className="mt-4 text-slate-600">Select a user to edit.</p>}
          </form>
        </div>
      )}
    </main>
  );
}
