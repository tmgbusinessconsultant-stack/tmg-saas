"use client";
import { useCallback, useEffect, useState } from "react";

type UserPlanAdmin = {
  id: string;
  userId: string;
  planId: string;
  billingCycle: string;
  status: string;
  allowedTools: string[];
  usageCount: number;
  usageLimit: number;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paypalSubscriptionId?: string;
  user: { email: string; name: string; role: string };
};

const ALL_TOOLS = ['cv-builder','cover-letter','business-plan','document-review','policy-generator','sop-builder','business-contracts','proposal-packs','business-assistant'];

export default function AdminPlansPanel() {
  const [plans, setPlans] = useState<UserPlanAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    const token = sessionStorage.getItem("accessToken");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/user-plans/admin/all`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Admin access required ${res.status} - Login as SUPER_ADMIN`);
      const data = await res.json();
      setPlans(data);
    } catch (e:any) { setError(e.message); }
    setLoading(false);
  }, []);

  useEffect(()=>{ load(); }, [load]);

  async function callAdmin(path: string, method="POST", body?: any) {
    const token = sessionStorage.getItem("accessToken");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
    const res = await fetch(`${apiUrl}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined
    });
    const j = await res.json().catch(()=> ({}));
    if (!res.ok) throw new Error(j.message || `Failed ${res.status}`);
    return j;
  }

  async function assignPlan(userId: string, planId: string, cycle: string) {
    try {
      await callAdmin(`/user-plans/admin/assign`, "POST", { userId, planId, billingCycle: cycle });
      alert(`✅ Assigned ${planId} ${cycle}`);
      load();
    } catch(e:any){ alert(e.message); }
  }

  async function renew(id: string) {
    try { await callAdmin(`/user-plans/admin/renew/${id}`); alert("✅ Renewed +30 days, usage reset"); load(); } catch(e:any){ alert(e.message); }
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    if (!confirm(`${newStatus === "BLOCKED" ? "Block" : "Unblock"} this user? ${newStatus==="BLOCKED" ? "They cannot use tools." : "They can use tools again."}`)) return;
    try { await callAdmin(`/user-plans/admin/status/${id}`, "POST", { status: newStatus }); alert(`✅ Status -> ${newStatus}`); load(); } catch(e:any){ alert(e.message); }
  }

  async function toggleAutoRenew(id: string, current: boolean) {
    try { await callAdmin(`/user-plans/admin/autorenew/${id}`, "POST", { autoRenew: !current }); alert(`✅ AutoRenew ${!current?"ON":"OFF"}`); load(); } catch(e:any){ alert(e.message); }
  }

  async function resetUsage(id: string) {
    if (!confirm("Reset usage to 0?")) return;
    try { await callAdmin(`/user-plans/admin/reset-usage/${id}`); alert("✅ Usage reset"); load(); } catch(e:any){ alert(e.message); }
  }

  async function updateTools(id: string, currentTools: string[]) {
    const input = prompt(`Enter allowed tools comma separated:\nAvailable: ${ALL_TOOLS.join(", ")}\n\nCurrent: ${currentTools.join(", ")}`, currentTools.join(","));
    if (input === null) return;
    const tools = input.split(",").map(s=>s.trim()).filter(Boolean);
    try { await callAdmin(`/user-plans/admin/tools/${id}`, "POST", { allowedTools: tools }); alert(`✅ Tools updated: ${tools.length}`); load(); } catch(e:any){ alert(e.message); }
  }

  if (loading) return <div className="p-6">Loading user plans...</div>;
  if (error) return <div className="p-6 text-red-600">❌ {error} — Login as admin@tmg.qa SUPER_ADMIN</div>;

  const filtered = plans.filter(p=>{
    if (filter==="active") return p.status==="ACTIVE";
    if (filter==="blocked") return p.status==="BLOCKED";
    if (filter==="expired") return new Date(p.endDate) < new Date();
    if (filter==="trial") return p.planId==="trial";
    return true;
  });

  return (
    <div className="mt-8 p-6 bg-white rounded-xl border shadow-sm">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">💰 Money Plan Control — Full Admin</h2>
          <p className="text-sm text-slate-500">Switch, Block, Allow, Accept, Renew, Tools, AutoRenew — Full Control</p>
        </div>
        <button onClick={load} className="px-3 py-1 bg-slate-100 rounded text-sm">🔄 Refresh</button>
      </div>

      <div className="mt-4 flex gap-2 flex-wrap">
        {["all","active","blocked","expired","trial"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${filter===f?"bg-black text-white":"bg-slate-100"}`}>{f} ({f==="all"?plans.length:filtered.length})</button>
        ))}
        <span className="text-xs text-slate-500 ml-auto">Total {plans.length} user plans | AutoRenew ON: {plans.filter(p=>p.autoRenew).length}</span>
      </div>
       
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left border-b bg-slate-50"><th className="p-2">User</th><th>Plan</th><th>Billing</th><th>Status</th><th>Tools / Allow</th><th>Usage</th><th>Expiry</th><th>AutoRenew</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(p=>{
              const daysLeft = Math.ceil((new Date(p.endDate).getTime() - Date.now())/(1000*60*60*24));
              const expiring = daysLeft <=3 && daysLeft >=0;
              const expired = daysLeft <0;
              const blocked = p.status==="BLOCKED";
              return (
                <tr key={p.id} className={`border-b ${blocked ? "bg-red-50" : expired ? "bg-red-50" : expiring ? "bg-yellow-50" : ""}`}>
                  <td className="py-2 px-2"><div className="font-medium">{p.user?.email}</div><div className="text-xs text-slate-500">{p.user?.name} | {p.user?.role}</div><div className="text-xs truncate max-w-[150px]">{p.paypalSubscriptionId ? `PayPal: ${p.paypalSubscriptionId.slice(0,12)}...` : "No sub"}</div></td>
                  <td className="p-2"><span className={`px-2 py-1 rounded text-xs font-bold ${p.planId==="trial"?"bg-purple-100":p.planId==="starter"?"bg-blue-100":p.planId==="pro"?"bg-black text-white":p.planId==="business"?"bg-yellow-200":"bg-slate-100"}`}>{p.planId.toUpperCase()}</span></td>
                  <td className="p-2">{p.billingCycle}<br/><span className="text-xs">{p.billingCycle==="annual"?"$yr":"$mo"}</span></td>
                  <td className="p-2"><span className={`px-2 py-1 rounded text-xs ${blocked?"bg-red-600 text-white":p.status==="ACTIVE"?"bg-green-100 text-green-700":"bg-slate-100"}`}>{p.status}</span><br/>{expired?"⛔ EXPIRED":expiring?`⚠️ ${daysLeft}d`:`✅ ${daysLeft}d`}</td>
                  <td className="p-2"><div className="text-xs">{p.allowedTools?.length} tools</div><div className="text-[10px] max-w-[120px] truncate">{p.allowedTools?.join(", ")}</div><button onClick={()=>updateTools(p.id, p.allowedTools)} className="mt-1 px-2 py-0.5 bg-slate-800 text-white rounded text-[10px]">Edit Tools</button></td>
                  <td className="p-2">{p.usageCount}/{p.usageLimit}<br/><button onClick={()=>resetUsage(p.id)} className="text-[10px] text-blue-600 underline">Reset</button></td>
                  <td className="p-2 text-xs">{new Date(p.endDate).toLocaleDateString()}<br/>{daysLeft}d left</td>
                  <td className="p-2"><button onClick={()=>toggleAutoRenew(p.id, p.autoRenew)} className={`px-2 py-1 rounded text-xs font-bold ${p.autoRenew?"bg-green-600 text-white":"bg-slate-200"}`}>{p.autoRenew?"ON":"OFF"}</button></td>
                  <td className="p-2">
                    <div className="flex flex-col gap-1 min-w-[140px]">
                      <div className="flex gap-1">
                        <button onClick={()=>renew(p.id)} className="px-2 py-1 bg-green-600 text-white rounded text-xs flex-1">Renew +30d</button>
                        <button onClick={()=>toggleStatus(p.id, p.status)} className={`px-2 py-1 rounded text-xs flex-1 ${blocked?"bg-green-500 text-white":"bg-red-600 text-white"}`}>{blocked?"Unblock":"Block"}</button>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={()=>assignPlan(p.userId, "starter", "monthly")} className="px-1 py-1 bg-blue-100 rounded text-[10px] flex-1">Starter</button>
                        <button onClick={()=>assignPlan(p.userId, "pro", "monthly")} className="px-1 py-1 bg-black text-white rounded text-[10px] flex-1">Pro</button>
                        <button onClick={()=>assignPlan(p.userId, "business", "monthly")} className="px-1 py-1 bg-yellow-500 rounded text-[10px] flex-1">Business</button>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={()=>assignPlan(p.userId, p.planId, "monthly")} className="px-1 py-1 bg-slate-100 rounded text-[10px] flex-1">To Monthly</button>
                        <button onClick={()=>assignPlan(p.userId, p.planId, "annual")} className="px-1 py-1 bg-slate-100 rounded text-[10px] flex-1">To Annual</button>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={()=>assignPlan(p.userId, "trial", "trial")} className="px-1 py-1 bg-purple-100 rounded text-[10px] flex-1">To Trial</button>
                        <button onClick={()=>{ if(confirm("Accept & Activate plan now?")) assignPlan(p.userId, p.planId, p.billingCycle); }} className="px-1 py-1 bg-emerald-600 text-white rounded text-[10px] flex-1">Accept / Activate</button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length===0 && <p className="p-4 text-center text-slate-500">No plans for filter {filter}</p>}
      </div>

      <div className="mt-6 p-4 bg-slate-50 rounded text-sm">
        <h3 className="font-bold">Admin Controls Explained:</h3>
        <ul className="mt-2 space-y-1 list-disc pl-5">
          <li><b>Switch Plan:</b> Starter / Pro / Business — changes allowedTools + usageLimit instantly</li>
          <li><b>Block / Unblock:</b> BLOCKED = user cannot use any tool (PlanGuard blocks). ACTIVE = allowed.</li>
          <li><b>Allow Tools:</b> Edit Tools = custom allow list e.g. only cv-builder + assistant</li>
          <li><b>Accept / Activate:</b> Manually accept trial or pending payment — sets ACTIVE + new endDate</li>
          <li><b>Monthly ↔ Annual:</b> Switch billing cycle, keeps same plan but changes expiry logic</li>
          <li><b>Renew +30d:</b> Extends endDate +30 days, resets usageCount to 0</li>
          <li><b>Reset Usage:</b> Reset usageCount to 0 without changing expiry</li>
          <li><b>AutoRenew ON/OFF:</b> If ON + paypalSubscriptionId exists, PayPal auto-charges → webhook renews</li>
        </ul>
      </div>
    </div>
  );
}

