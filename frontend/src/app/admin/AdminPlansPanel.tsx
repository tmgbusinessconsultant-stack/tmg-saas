"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
  const [filter, setFilter] = useState<"ALL"|"ACTIVE"|"BLOCKED"|"EXPIRED"|"TRIAL">("ALL");

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/user-plans/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchPlans(); }, []);

  const action = async (id: string, type: string, extra?: any) => {
    const token = localStorage.getItem("token");
    let url = `${API}/api/user-plans/admin/${type}/${id}`;
    if (type === "switch") url = `${API}/api/user-plans/admin/switch/${id}`;
    if (type === "billing") url = `${API}/api/user-plans/admin/billing/${id}`;
    if (type === "tools") url = `${API}/api/user-plans/admin/tools/${id}`;
    if (type === "status") url = `${API}/api/user-plans/admin/status/${id}`;
    if (type === "renew") url = `${API}/api/user-plans/admin/renew/${id}`;
    if (type === "reset") url = `${API}/api/user-plans/admin/reset-usage/${id}`;
    if (type === "accept") url = `${API}/api/user-plans/admin/accept/${id}`;
    if (type === "activate") url = `${API}/api/user-plans/admin/activate/${id}`;

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(extra || {}),
    });
    fetchPlans();
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
          <p className="text-xs text-slate-500">Switch, Block, Allow, Accept, AutoRenew — Full Control • {filtered.length} users • Total {plans.length}</p>
        </div>
        <div className="flex gap-2">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search email, plan..." className="px-3 py-2 text-sm border rounded-lg w-64" />
          <button onClick={fetchPlans} className="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50">Refresh</button>
        </div>
      </div>

      <div className="flex gap-2 p-3 border-b bg-slate-50 overflow-x-auto">
        {["ALL","ACTIVE","BLOCKED","EXPIRED","TRIAL"].map(f=>(
          <button key={f} onClick={()=>setFilter(f as any)} className={`px-3 py-1.5 text-xs rounded-full border whitespace-nowrap ${filter===f?'bg-black text-white':'bg-white hover:bg-slate-100'}`}>{f}</button>
        ))}
      </div>

      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr><th className="text-left p-3">User</th><th className="text-left p-3">Plan</th><th className="text-left p-3">Status</th><th className="text-left p-3">Tools</th><th className="text-left p-3">Expiry</th><th className="text-left p-3">Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(p=>(
              <tr key={p.id} className="border-t hover:bg-slate-50">
                <td className="p-3"><div className="font-mono text-xs">{p.user?.email || p.userId.slice(0,12)}</div><div className="text-[10px] text-slate-400">{p.billingCycle} • {p.autoRenew?'Auto ON':'Auto OFF'}</div></td>
                <td className="p-3"><span className="px-2 py-1 rounded bg-slate-900 text-white text-xs">{p.planId}</span></td>
                <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${p.status==='ACTIVE'?'bg-green-100 text-green-700':p.status==='BLOCKED'?'bg-red-100 text-red-700':'bg-yellow-100'}`}>{p.status}</span></td>
                <td className="p-3 text-xs">{p.allowedTools?.length} tools</td>
                <td className="p-3 text-xs">{new Date(p.endDate).toLocaleDateString()}<div className="text-[10px] text-slate-400">{Math.ceil((new Date(p.endDate).getTime()-Date.now())/86400000)}d left</div></td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1 w-[260px]">
                    <button onClick={()=>action(p.id,'renew')} className="px-2 py-1 text-[11px] bg-blue-600 text-white rounded">Renew +30d</button>
                    <button onClick={()=>action(p.id,'status',{status: p.status==='BLOCKED'?'ACTIVE':'BLOCKED'})} className={`px-2 py-1 text-[11px] rounded text-white ${p.status==='BLOCKED'?'bg-green-600':'bg-red-600'}`}>{p.status==='BLOCKED'?'Unblock':'Block'}</button>
                    <button onClick={()=>{const t=prompt('Tools comma separated',p.allowedTools.join(',')); if(t) action(p.id,'tools',{allowedTools:t.split(',').map((s:string)=>s.trim())})}} className="px-2 py-1 text-[11px] bg-slate-800 text-white rounded">Edit Tools</button>
                    <button onClick={()=>action(p.id,'switch',{planId:'PRO'})} className="px-2 py-1 text-[11px] bg-purple-600 text-white rounded">PRO</button>
                    <button onClick={()=>action(p.id,'switch',{planId:'BUSINESS'})} className="px-2 py-1 text-[11px] bg-black text-white rounded">BUSINESS</button>
                    <button onClick={()=>action(p.id,'switch',{planId:'STARTER'})} className="px-2 py-1 text-[11px] bg-slate-200 rounded">STARTER</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden p-3 grid gap-3">
        {filtered.map(p=>(
          <div key={p.id} className="border rounded-xl p-3 space-y-2">
            <div className="flex justify-between"><span className="font-mono text-xs">{p.user?.email}</span><span className="text-xs px-2 py-1 rounded bg-slate-900 text-white">{p.planId} {p.status}</span></div>
            <div className="text-xs text-slate-500">{p.billingCycle} • Exp: {new Date(p.endDate).toLocaleDateString()} • {p.autoRenew?'Auto ON':'OFF'}</div>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={()=>action(p.id,'renew')} className="flex-1 px-2 py-2 text-xs bg-blue-600 text-white rounded">Renew</button>
              <button onClick={()=>action(p.id,'status',{status: p.status==='BLOCKED'?'ACTIVE':'BLOCKED'})} className={`flex-1 px-2 py-2 text-xs rounded text-white ${p.status==='BLOCKED'?'bg-green-600':'bg-red-600'}`}>{p.status==='BLOCKED'?'Unblock':'Block'}</button>
              <button onClick={()=>action(p.id,'switch',{planId:'PRO'})} className="px-2 py-2 text-xs bg-purple-600 text-white rounded">PRO</button>
              <button onClick={()=>action(p.id,'switch',{planId:'BUSINESS'})} className="px-2 py-2 text-xs bg-black text-white rounded">BIZ</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
