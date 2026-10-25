"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:3001";

type Plan = {
  id: string;
  userId: string;
  planId: string;
  billingCycle: string;
  status: string;
  allowedTools: string[];
  usedTools?: number;
  totalTools?: number;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paypalSubscriptionId?: string;
  user?: { email: string; role: string };
};

export default function AdminPlansPanel() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "BLOCKED" | "EXPIRED" | "TRIAL">("ALL");
  const [error, setError] = useState("");

  const getToken = () => sessionStorage.getItem("accessToken") || localStorage.getItem("token") || "";

  const fetchPlans = async () => {
    try {
      setLoading(true); setError("");
      const token = getToken();
      // Try both endpoints for compatibility
      let res = await fetch(`${API}/user-plans/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store"
      });
      if (!res.ok) {
        // fallback to your old /api prefix
        res = await fetch(`${API}/api/user-plans/admin/all`, {
          headers: { Authorization: `Bearer ${token}` }, cache: "no-store"
        });
      }
      if (!res.ok) throw new Error(`Failed ${res.status}`);
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : data.data || []);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchPlans(); }, []);

  const action = async (id: string, type: string, extra?: any) => {
    // confirmations
    if (type === "status" && !window.confirm(`Change status to ${extra?.status}?`)) return;
    if (type === "switch" && !window.confirm(`Switch plan to ${extra?.planId}? This will change billing immediately.`)) return;
    if (type === "delete" && !window.confirm(`DELETE this plan permanently? User will lose access.`)) return;

    try {
      setBusyId(id); setError("");
      const token = getToken();
      const base = `${API}/user-plans/admin`;
      const baseApi = `${API}/api/user-plans/admin`;

      let path = `${base}/${type}/${id}`;
      if (type === "switch") path = `${base}/switch/${id}`;
      if (type === "billing") path = `${base}/billing/${id}`;
      if (type === "tools") path = `${base}/tools/${id}`;
      if (type === "status") path = `${base}/status/${id}`;
      if (type === "renew") path = `${base}/renew/${id}`;
      if (type === "reset") path = `${base}/reset-usage/${id}`;
      if (type === "accept") path = `${base}/accept/${id}`;
      if (type === "activate") path = `${base}/activate/${id}`;
      if (type === "delete") path = `${base}/delete/${id}`;

      let res = await fetch(path, {
        method: type === "delete" ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: type === "delete" ? undefined : JSON.stringify(extra || {}),
      });

      // fallback to /api prefix if 404
      if (res.status === 404) {
        const fallbackPath = path.replace(base, baseApi);
        res = await fetch(fallbackPath, {
          method: type === "delete" ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: type === "delete" ? undefined : JSON.stringify(extra || {}),
        });
      }

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Action failed ${res.status}`);
      }
      await fetchPlans();
    } catch (e: any) { setError(e.message); } finally { setBusyId(""); }
  };

  const filtered = plans.filter(p => {
    const matchSearch = `${p.user?.email} ${p.planId} ${p.userId}`.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === "ALL") return true;
    if (filter === "BLOCKED") return p.status === "BLOCKED";
    if (filter === "EXPIRED") return p.status === "EXPIRED";
    if (filter === "TRIAL") return p.planId === "TRIAL";
    if (filter === "ACTIVE") return p.status === "ACTIVE";
    return true;
  });

  if (loading) return <div className="p-6">Loading money plans...</div>;

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b">
        <div>
          <h2 className="font-bold text-lg">💰 Money Plan Control — Full Admin</h2>
          <p className="text-xs text-slate-500">Switch, Block, Allow, Accept, AutoRenew • {filtered.length} shown • Total {plans.length}</p>
          {error && <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>}
        </div>
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email, plan..." className="px-3 py-2 text-sm border rounded-lg w-64" />
          <button onClick={fetchPlans} className="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50">Refresh</button>
        </div>
      </div>

      <div className="flex gap-2 p-3 border-b bg-slate-50 overflow-x-auto">
        {["ALL", "ACTIVE", "BLOCKED", "EXPIRED", "TRIAL"].map(f => (
          <button key={f} onClick={() => setFilter(f as any)} className={`px-3 py-1.5 text-xs rounded-full border whitespace-nowrap ${filter === f ? 'bg-black text-white' : 'bg-white hover:bg-slate-100'}`}>{f}</button>
        ))}
      </div>

      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr><th className="text-left p-3">User</th><th className="text-left p-3">Plan</th><th className="text-left p-3">Status</th><th className="text-left p-3">Tools</th><th className="text-left p-3">Expiry</th><th className="text-left p-3">Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className={`border-t hover:bg-slate-50 ${busyId === p.id ? 'opacity-50' : ''}`}>
                <td className="p-3"><div className="font-mono text-xs">{p.user?.email || p.userId.slice(0, 12)}</div><div className="text-[10px] text-slate-400">{p.billingCycle} • {p.autoRenew ? 'Auto ON' : 'Auto OFF'} • {p.paypalSubscriptionId ? 'PayPal' : 'Manual'}</div></td>
                <td className="p-3"><span className="px-2 py-1 rounded bg-slate-900 text-white text-xs">{p.planId}</span></td>
                <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : p.status === 'BLOCKED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100'}`}>{p.status}</span></td>
                <td className="p-3 text-xs">{p.allowedTools?.length} tools<br /><span className="text-[10px] text-slate-400">{p.usedTools ?? 0}/{p.totalTools ?? '-'}</span></td>
                <td className="p-3 text-xs">{new Date(p.endDate).toLocaleDateString()}<div className="text-[10px] text-slate-400">{Math.ceil((new Date(p.endDate).getTime() - Date.now()) / 86400000)}d left</div></td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1 w-[320px]">
                    <button disabled={!!busyId} onClick={() => action(p.id, 'renew')} className="px-2 py-1 text-[11px] bg-blue-600 text-white rounded disabled:opacity-50">Renew +30d</button>
                    <button disabled={!!busyId} onClick={() => action(p.id, 'status', { status: p.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED' })} className={`px-2 py-1 text-[11px] rounded text-white disabled:opacity-50 ${p.status === 'BLOCKED' ? 'bg-green-600' : 'bg-red-600'}`}>{p.status === 'BLOCKED' ? 'Unblock' : 'Block'}</button>
                    <button disabled={!!busyId} onClick={() => { const t = prompt('Tools comma separated', p.allowedTools.join(',')); if (t) action(p.id, 'tools', { allowedTools: t.split(',').map((s: string) => s.trim()) }) }} className="px-2 py-1 text-[11px] bg-slate-800 text-white rounded">Edit Tools</button>
                    <button disabled={!!busyId} onClick={() => action(p.id, 'reset')} className="px-2 py-1 text-[11px] bg-yellow-600 text-white rounded">Reset Usage</button>
                    <button disabled={!!busyId} onClick={() => action(p.id, 'switch', { planId: 'PRO' })} className="px-2 py-1 text-[11px] bg-purple-600 text-white rounded">PRO</button>
                    <button disabled={!!busyId} onClick={() => action(p.id, 'switch', { planId: 'BUSINESS' })} className="px-2 py-1 text-[11px] bg-black text-white rounded">BUSINESS</button>
                    <button disabled={!!busyId} onClick={() => action(p.id, 'switch', { planId: 'STARTER' })} className="px-2 py-1 text-[11px] bg-slate-200 rounded">STARTER</button>
                    <button disabled={!!busyId} onClick={() => action(p.id, 'delete')} className="px-2 py-1 text-[11px] bg-red-50 text-red-600 border border-red-200 rounded">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-500">No plans found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="lg:hidden p-3 grid gap-3">
        {filtered.map(p => (
          <div key={p.id} className="border rounded-xl p-3 space-y-2">
            <div className="flex justify-between"><span className="font-mono text-xs">{p.user?.email}</span><span className="text-xs px-2 py-1 rounded bg-slate-900 text-white">{p.planId} {p.status}</span></div>
            <div className="text-xs text-slate-500">{p.billingCycle} • Exp: {new Date(p.endDate).toLocaleDateString()} • {p.autoRenew ? 'Auto ON' : 'OFF'}</div>
            <div className="flex flex-wrap gap-1.5">
              <button disabled={!!busyId} onClick={() => action(p.id, 'renew')} className="flex-1 px-2 py-2 text-xs bg-blue-600 text-white rounded">Renew</button>
              <button disabled={!!busyId} onClick={() => action(p.id, 'status', { status: p.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED' })} className={`flex-1 px-2 py-2 text-xs rounded text-white ${p.status === 'BLOCKED' ? 'bg-green-600' : 'bg-red-600'}`}>{p.status === 'BLOCKED' ? 'Unblock' : 'Block'}</button>
              <button disabled={!!busyId} onClick={() => action(p.id, 'switch', { planId: 'PRO' })} className="px-2 py-2 text-xs bg-purple-600 text-white rounded">PRO</button>
              <button disabled={!!busyId} onClick={() => action(p.id, 'switch', { planId: 'BUSINESS' })} className="px-2 py-2 text-xs bg-black text-white rounded">BIZ</button>
              <button disabled={!!busyId} onClick={() => action(p.id, 'delete')} className="px-2 py-2 text-xs bg-red-50 text-red-600 border rounded">Del</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}