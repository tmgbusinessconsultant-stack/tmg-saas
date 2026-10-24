"use client";
import { useEffect, useState } from "react";

const PLANS = {
  starter: { 
    name: "Starter", monthly: 27.20, annual: 272, 
    tools: ["CV Builder", "Business Assistant"], 
    count: "1 AI Tool", limit: "10 docs/month", 
    features: ["1 AI tool", "Basic CV templates", "Business Assistant", "Email support"], 
    popular: false, id: "starter" 
  },
  pro: { 
    name: "Pro", monthly: 82.14, annual: 821.4, 
    tools: ["CV Builder", "Cover Letter", "Business Plan", "Document Review", "Policy Generator", "Business Assistant"], 
    count: "6 AI Tools", limit: "100 docs/month", 
    features: ["6 AI tools", "Advanced CV + Cover", "Business Plan generator", "Document Review", "Priority support"], 
    popular: true, id: "pro" 
  },
  business: { 
    name: "Business", monthly: 274.45, annual: 2744.5, 
    tools: ["CV Builder", "Cover Letter", "Business Plan", "Document Review", "Policy Generator", "SOP Builder", "Business Contracts", "Proposal Packs", "Business Assistant"], 
    count: "9 AI Tools - All", limit: "1000 docs/month", 
    features: ["All 9 tools", "Human expert review", "SOP/policy pack", "1-on-1 consulting", "24h support"], 
    popular: false, id: "business" 
  }
};

export default function PricingCheckout() {
  const [billing, setBilling] = useState<"monthly"|"annual">("monthly");
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
    if (!token) return;
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL||"").replace(/\/+$/,"");
    fetch(`${apiUrl}/user-plans/current`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.ok?r.json():null)
      .then(setCurrentPlan)
      .catch(()=>{});
  }, []);

  async function startTrial() {
    const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
    if (!token) { alert("Login first"); location.href="/login"; return; }
    setTrialLoading(true);
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL||"").replace(/\/+$/,"");
    try {
      const res = await fetch(`${apiUrl}/user-plans/start-trial`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.json()).message);
      alert("7-day Trial started! Redirecting to AI Tools...");
      location.href="/ai-tools";
    } catch (e:any) { alert(e.message); }
    setTrialLoading(false);
  }

  async function handleBuy(planKey: keyof typeof PLANS) {
    const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
    if (!token) { alert("Login expired"); location.href="/login"; return; }
    const p = PLANS[planKey];
    setBuying(planKey);
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL||"").replace(/\/+$/,"");
    try {
      const orderRes = await fetch(`${apiUrl}/payments/orders`, {
        method: "POST", headers: { "Content-Type":"application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: p.id, billingCycle: billing })
      });
      if (!orderRes.ok) throw new Error(await orderRes.text());
      const order = await orderRes.json();
      const capRes = await fetch(`${apiUrl}/payments/capture`, {
        method: "POST", headers: { "Content-Type":"application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderID: order.id, planId: p.id, billingCycle: billing })
      });
      if (!capRes.ok) throw new Error(await capRes.text());
      alert(`✅ ${p.name} activated! Opening your AI tools...`);
      location.href="/ai-tools";
    } catch (e:any) { alert("Checkout failed: "+e.message); }
    setBuying(null);
  }

  return (
    <div className="space-y-8">
      {currentPlan?.planId && (
        <div className={`p-4 rounded-xl border ${currentPlan.isExpired ? "bg-red-50 border-red-300" : currentPlan.isExpiringSoon ? "bg-yellow-50 border-yellow-300" : "bg-green-50 border-green-300"}`}>
          <p className="font-semibold">Active: {currentPlan.planId} ({currentPlan.billingCycle}) - {currentPlan.daysLeft || 0} days left</p>
          <p className="text-sm">Tools: {currentPlan.allowedTools?.join(", ")} | Used: {currentPlan.usageCount}/{currentPlan.usageLimit}</p>
        </div>
      )}
      {!currentPlan?.planId && (
        <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-yellow-50 rounded-2xl border border-dashed border-[#D4AF37]">
          <h3 className="text-xl font-bold">Try 7 Days Free - No Credit Card</h3>
          <p className="text-sm text-slate-600">Get CV Builder + Business Assistant - 3 docs free</p>
          <button disabled={trialLoading} onClick={startTrial} className="mt-3 bg-black text-white px-6 py-2 rounded-full font-semibold">{trialLoading?"Starting...":"Start 7-Day Free Trial"}</button>
        </div>
      )}
      <div className="flex justify-center"><div className="bg-slate-100 p-1 rounded-full flex"><button onClick={()=>setBilling("monthly")} className={`px-6 py-2 rounded-full text-sm font-semibold ${billing==="monthly"?"bg-white shadow":""}`}>Monthly</button><button onClick={()=>setBilling("annual")} className={`px-6 py-2 rounded-full text-sm font-semibold ${billing==="annual"?"bg-white shadow":""}`}>Annual <span className="text-green-600">-2 months free</span></button></div></div>
      <div id="pricing" className="grid md:grid-cols-3 gap-6">
        {(Object.keys(PLANS) as Array<keyof typeof PLANS>).map((key)=>{
          const p=PLANS[key]; const price=billing==="monthly"?p.monthly:p.annual; 
          const isCurrent = currentPlan?.planId?.toLowerCase() === key;
          return (
            <div key={key} className={`rounded-2xl border p-6 bg-white ${p.popular?"border-black shadow-xl md:scale-105":"border-slate-200"} ${isCurrent?"ring-2 ring-green-500":""}`}>
              {p.popular && <div className="bg-black text-white text-xs px-3 py-1 rounded-full inline-block mb-3">MOST POPULAR</div>}
              <h3 className="text-xl font-bold">{p.name}</h3>
              <p className="text-sm text-slate-500">{p.count} - {p.limit}</p>
              <div className="mt-4"><span className="text-3xl font-bold">${price}</span><span className="text-slate-500">/{billing==="monthly"?"mo":"yr"}</span></div>
              <div className="mt-4 space-y-2"><p className="text-xs font-semibold uppercase tracking-wide">Includes:</p>{p.tools.map((t:string)=><div key={t} className="text-sm flex gap-1"><span>✅</span>{t}</div>)}</div>
              <ul className="mt-4 space-y-1 text-sm text-slate-600 border-t pt-4">{p.features.map((f:string)=><li key={f}>• {f}</li>)}</ul>
              <button onClick={()=>!isCurrent && handleBuy(key)} disabled={isCurrent || buying===key} className={`mt-6 w-full py-3 rounded-full font-semibold transition-all ${isCurrent?"bg-green-100 text-green-700 border border-green-300":p.popular?"bg-black text-white hover:bg-gray-800 cursor-pointer":"bg-white border border-black hover:bg-gray-50 cursor-pointer"}`}>{buying===key?"Processing...":isCurrent?"✓ Current":`Get ${p.name} - $${price}`}</button>
              <p className="text-xs text-center mt-2 text-slate-400">Auto-renewal {billing} • PayPal • Cancel anytime</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
