"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const PayPalScriptProvider = dynamic(
  () => import("@paypal/react-paypal-js").then(m => m.PayPalScriptProvider),
  { ssr: false }
);
const PayPalButtons = dynamic(
  () => import("@paypal/react-paypal-js").then(m => m.PayPalButtons),
  { ssr: false }
);

// EXACT IDs from your PayPal screenshot - DO NOT CHANGE
const PAYPAL_PLANS = {
  starter: {
    monthly: 'P-6JD50850NE4749845NLPPESI',
    annual: 'P-75J29224C3623300JNLPPPSI',
    name: "Starter", priceM: 27.20, priceY: 272,
    count: "1 AI Tool", limit: "10 docs/month",
    features: ["1 AI tool", "Basic CV templates", "Business Assistant", "Email support"],
    popular: false,
  },
  pro: {
    monthly: 'P-6JB47037J1H7198935NLPP4AI',
    annual: 'P-4KL53403RN578542RNLPQA5Q',
    name: "Pro", priceM: 52.70, priceY: 527,
    count: "6 AI Tools", limit: "100 docs/month",
    features: ["6 AI tools", "Advanced CV + Cover", "Business Plan generator", "Document Review", "Priority support"],
    popular: true,
  },
  business: {
    monthly: 'P-01J32058YU35O5116NLPQF6Q',
    annual: 'P-48A98289TE6078010NLPQJSQ',
    name: "Business", priceM: 72.60, priceY: 726,
    count: "9 AI Tools - All", limit: "1000 docs/month",
    features: ["All 9 tools", "Human expert review", "SOP/policy pack", "1-on-1 consulting", "24h support"],
    popular: false,
  }
} as const;

type PlanKey = keyof typeof PAYPAL_PLANS;

export default function PricingCheckout() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
    if (!token) { setLoadingPlan(false); return; }
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");
    fetch(`${apiUrl}/user-plans/current`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(setCurrentPlan)
      .catch(() => null)
      .finally(() => setLoadingPlan(false));
  }, []);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  if (!mounted) return <p className="text-center py-20">Loading pricing...</p>;
  if (!clientId) return <p className="text-center text-red-500">Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID</p>;

  return (
    <PayPalScriptProvider options={{ clientId, vault: true, intent: "subscription", currency: "USD" }}>
      <div className="space-y-10">
        <div className="flex justify-center">
          <div className="bg-white border p-1 rounded-full flex shadow-sm">
            <button onClick={() => setBilling("monthly")} className={`px-7 py-2.5 rounded-full text-sm font-semibold ${billing === "monthly" ? "bg-zinc-900 text-white" : "text-zinc-500"}`}>Monthly</button>
            <button onClick={() => setBilling("annual")} className={`px-7 py-2.5 rounded-full text-sm font-semibold ${billing === "annual" ? "bg-zinc-900 text-white" : "text-zinc-500"}`}>Annual</button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {(Object.keys(PAYPAL_PLANS) as PlanKey[]).map((key) => {
            const p = PAYPAL_PLANS[key];
            const price = billing === "monthly" ? p.priceM : p.priceY;
            const planId = billing === "monthly" ? p.monthly : p.annual;
            return (
              <div key={key} className={`rounded-[24px] border p-7 bg-white flex flex-col ${p.popular ? "border-zinc-900 shadow-xl md:-translate-y-2" : "border-zinc-200"}`}>
                {p.popular && <div className="bg-[#D4AF37] text-[10px] font-bold uppercase px-3 py-1 rounded-full self-start mb-4">Most Popular</div>}
                <h3 className="text-xl font-bold">{p.name}</h3>
                <p className="text-sm text-zinc-500 mt-1">{p.count} • {p.limit}</p>
                <div className="mt-5 flex items-baseline gap-1"><span className="text-4xl font-bold">${price}</span><span className="text-sm text-zinc-500">/{billing === "monthly" ? "mo" : "yr"}</span></div>

                <div className="mt-6">
                  <PayPalButtons
                    style={{ layout: "vertical", color: "gold", shape: "pill", label: "subscribe" }}
                    createSubscription={async () => {
                      console.log("Creating sub for", planId);
                      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");
                      const res = await fetch(`${apiUrl}/paypal/create-sub`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ plan_id: planId })
                      });
                      const data = await res.json();
                      if (!data.id) {
                        console.error("Backend error", data);
                        alert("PayPal Error: " + JSON.stringify(data).slice(0, 300));
                        throw new Error(JSON.stringify(data));
                      }
                      return data.id;
                    }}
                    onApprove={async (data) => {
                      console.log("SUBSCRIBED:", data.subscriptionID);
                      const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
                      if (!token) { alert("Login first"); window.location.href = "/login"; return; }
                      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");
                      try {
                        await fetch(`${apiUrl}/paypal/verify`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ subscriptionID: data.subscriptionID, planId: key, billingCycle: billing })
                        });
                      } catch (e) { console.error(e); }
                      window.location.href = "/success?sub=" + data.subscriptionID;
                    }}
                    onError={(err) => {
                      console.error("PayPal Error", err);
                      alert("PayPal error - check console");
                    }}
                  />
                </div>
                <ul className="mt-6 space-y-2 text-sm">
                  {p.features.map(f => <li key={f}>• {f}</li>)}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </PayPalScriptProvider>
  );
}