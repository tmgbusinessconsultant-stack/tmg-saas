"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
} as const;

type PlanKey = keyof typeof PLANS;

export default function PricingCheckout() {
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [buying, setBuying] = useState<PlanKey | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
    if (!token) { setLoadingPlan(false); return; }
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
    if (!apiUrl) { setLoadingPlan(false); return; }
    fetch(`${apiUrl}/user-plans/current`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(setCurrentPlan)
      .finally(() => setLoadingPlan(false));
  }, []);

  async function startTrial() {
    const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
    if (!token) { router.push("/login"); return; }
    setTrialLoading(true);
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
    try {
      const res = await fetch(`${apiUrl}/user-plans/start-trial`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      router.push("/ai-tools");
    } catch (e: any) { alert(e.message); }
    setTrialLoading(false);
  }

  async function handleBuy(planKey: PlanKey) {
    const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
    if (!token) { router.push("/login"); return; }
    const p = PLANS[planKey];
    setBuying(planKey);
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
    try {
      const orderRes = await fetch(`${apiUrl}/payments/orders`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: p.id, billingCycle: billing })
      });
      if (!orderRes.ok) throw new Error(await orderRes.text());
      const order = await orderRes.json();
      const capRes = await fetch(`${apiUrl}/payments/capture`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderID: order.id, planId: p.id, billingCycle: billing })
      });
      if (!capRes.ok) throw new Error(await capRes.text());
      router.push("/ai-tools");
    } catch (e: any) { alert("Checkout failed: " + e.message); }
    setBuying(null);
  }

  return (
    <div className="space-y-10">
      {/* Current Plan - Premium */}
      {!loadingPlan && currentPlan?.planId && (
        <div className={`rounded-[20px] border p-5 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] ${currentPlan.isExpired ? "border-red-200 bg-red-50/50" : currentPlan.isExpiringSoon ? "border-amber-200 bg-amber-50/50" : "border-emerald-200 bg-emerald-50/30"}`}>
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <p className="font-semibold text-zinc-900">Active: <span className="text-[#D4AF37]">{currentPlan.planId}</span> • {currentPlan.billingCycle} • {currentPlan.daysLeft || 0} days left</p>
            <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide ${currentPlan.isExpired ? "bg-red-500 text-white" : "bg-zinc-900 text-white"}`}>{currentPlan.isExpired ? "Expired" : "Active"}</span>
          </div>
          <p className="mt-2 text-sm text-zinc-500">{currentPlan.allowedTools?.join(" • ")} | {currentPlan.usageCount}/{currentPlan.usageLimit} used</p>
        </div>
      )}

      {/* Trial - On Brand */}
      {!loadingPlan && !currentPlan?.planId && (
        <div className="text-center p-8 rounded-[24px] border border-[#D4AF37]/20 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900 text-white text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1">Free Trial</div>
          <h3 className="mt-4 text-2xl font-bold text-zinc-900">Try 7 Days Free</h3>
          <p className="mt-2 text-sm text-zinc-500">CV Builder + Business Assistant — 3 docs free, no card</p>
          <button disabled={trialLoading} onClick={startTrial} className="mt-5 bg-zinc-900 text-white px-7 py-3 rounded-full text-sm font-semibold hover:bg-black transition-all disabled:opacity-50">
            {trialLoading ? "Starting..." : "Start 7-Day Free Trial"}
          </button>
        </div>
      )}

      {/* Billing Toggle - Premium */}
      <div className="flex justify-center">
        <div className="bg-white border border-zinc-200 p-1 rounded-full flex shadow-sm">
          <button onClick={() => setBilling("monthly")} className={`px-7 py-2.5 rounded-full text-sm font-semibold transition-all ${billing === "monthly" ? "bg-zinc-900 text-white shadow" : "text-zinc-500 hover:text-zinc-900"}`}>Monthly</button>
          <button onClick={() => setBilling("annual")} className={`px-7 py-2.5 rounded-full text-sm font-semibold transition-all ${billing === "annual" ? "bg-zinc-900 text-white shadow" : "text-zinc-500 hover:text-zinc-900"}`}>Annual <span className="ml-1 text-emerald-600 text-xs">-2 mo free</span></button>
        </div>
      </div>

      {/* Plans - Premium Cards */}
      <div id="pricing" className="grid md:grid-cols-3 gap-6">
        {(Object.keys(PLANS) as PlanKey[]).map((key) => {
          const p = PLANS[key]; const price = billing === "monthly" ? p.monthly : p.annual;
          const isCurrent = currentPlan?.planId?.toLowerCase() === key;
          return (
            <div key={key} className={`rounded-[24px] border p-7 bg-white flex flex-col transition-all ${p.popular ? "border-zinc-900 shadow-[0_20px_50px_rgba(0,0,0,0.08)] md:-translate-y-2" : "border-zinc-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"} ${isCurrent ? "ring-2 ring-emerald-500 ring-offset-2" : ""}`}>
              {p.popular && <div className="bg-[#D4AF37] text-zinc-900 text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full inline-block self-start mb-4">Most Popular</div>}
              <h3 className="text-xl font-bold text-zinc-900">{p.name}</h3>
              <p className="text-sm text-zinc-500 mt-1">{p.count} • {p.limit}</p>
              <div className="mt-5 flex items-baseline gap-1"><span className="text-4xl font-bold tracking-tight text-zinc-900">${price}</span><span className="text-sm text-zinc-500">/{billing === "monthly" ? "mo" : "yr"}</span></div>

              <div className="mt-6 space-y-2.5"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Includes</p>{p.tools.map((t: string) => <div key={t} className="text-sm text-zinc-700 flex gap-2"><span className="text-[#D4AF37]">—</span>{t}</div>)}</div>
              <ul className="mt-6 space-y-1.5 text-sm text-zinc-500 border-t border-zinc-100 pt-5">{p.features.map((f: string) => <li key={f} className="flex gap-2"><span className="text-zinc-300">•</span>{f}</li>)}</ul>

              <button onClick={() => !isCurrent && handleBuy(key)} disabled={isCurrent || buying === key} className={`mt-7 w-full py-3.5 rounded-full text-sm font-semibold transition-all ${isCurrent ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : p.popular ? "bg-zinc-900 text-white hover:bg-black" : "bg-white border border-zinc-900 text-zinc-900 hover:bg-zinc-50"}`}>
                {buying === key ? "Processing..." : isCurrent ? "✓ Current Plan" : `Get ${p.name} — $${price}`}
              </button>
              <p className="text-[11px] text-center mt-3 text-zinc-400">Auto-renewal {billing} • PayPal • Cancel anytime</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}