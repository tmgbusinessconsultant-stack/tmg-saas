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

// TMG Real Plans - connected to your .env PayPal IDs
const PAYPAL_PLANS = {
  starter: {
    monthly: 'P-6JD50850NE6749845NLPPESI',
    annual: 'P-75J29224C3625300JNLPPPSI',
    name: "Starter", priceM: 27.20, priceY: 272, qarM: 99,
    count: "1 AI Tool", limit: "10 docs/month",
    features: ["1 AI tool", "Basic CV Builder", "Business Assistant", "Email support"],
    popular: false,
  },
  pro: {
    monthly: 'P-6JB47037J1H7198935NLPP4AI',
    annual: 'P-4KL53403RN578542RNLPQA5Q',
    name: "Pro", priceM: 82, priceY: 820, qarM: 299,
    count: "All 6 AI Tools", limit: "100 docs/month",
    features: ["All 6 AI tools", "CV + Business Plan", "Document Review", "Risk & SOP", "Priority support"],
    popular: true,
  },
  business: {
    monthly: 'P-01J52058YU3S05116NLPQF6Q',
    annual: 'P-48A98289TE6078010NLPQJSQ',
    name: "Business", priceM: 274, priceY: 2740, qarM: 999,
    count: "All AI Tools + Expert", limit: "1000 docs/month",
    features: ["Everything in Pro", "Human expert review", "SOP & Policy pack", "1-on-1 consultation", "Market-specific review"],
    popular: false,
  }
} as const;

type PlanKey = keyof typeof PAYPAL_PLANS;

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  if (!mounted) return <div className="text-center py-20">Loading pricing...</div>;

  return (
    <div className="min-h-screen bg-white py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">Pricing</h1>
        <p className="text-center text-zinc-500 mb-8">Choose plan to unlock AI Tools - PayPal Secure</p>

        <div className="flex justify-center mb-10">
          <div className="bg-zinc-100 border p-1 rounded-full flex">
            <button onClick={() => setBilling("monthly")} className={`px-7 py-2.5 rounded-full text-sm font-semibold ${billing === "monthly" ? "bg-zinc-900 text-white" : "text-zinc-500"}`}>Monthly</button>
            <button onClick={() => setBilling("annual")} className={`px-7 py-2.5 rounded-full text-sm font-semibold ${billing === "annual" ? "bg-zinc-900 text-white" : "text-zinc-500"}`}>Annual</button>
          </div>
        </div>

        {!clientId && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-center mb-6">Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID in frontend/.env.local</div>}

        <div className="grid md:grid-cols-3 gap-6">
          {(Object.keys(PAYPAL_PLANS) as PlanKey[]).map((key) => {
            const p = PAYPAL_PLANS[key];
            const price = billing === "monthly" ? p.priceM : p.priceY;
            const planId = billing === "monthly" ? p.monthly : p.annual;
            
            return (
              <div key={key} className={`rounded-[24px] border p-7 bg-white flex flex-col ${p.popular ? "border-zinc-900 shadow-xl md:-translate-y-2" : "border-zinc-200"}`}>
                {p.popular && <div className="bg-[#D4AF37] text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full self-start mb-4">Most Popular</div>}
                <h3 className="text-xl font-bold">{p.name}</h3>
                <p className="text-sm text-zinc-500 mt-1">{p.count} • {p.limit}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${price}</span>
                  <span className="text-sm text-zinc-500">/{billing === "monthly" ? "mo" : "yr"}</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">QAR {p.qarM}/mo in Qatar</p>

                <div className="mt-6">
                  {clientId ? (
                    <PayPalScriptProvider options={{ clientId, vault: true, intent: "subscription", currency: "USD" }}>
                      <PayPalButtons
                        style={{ layout: "vertical", color: "gold", shape: "pill", label: "subscribe" }}
                        createSubscription={(data, actions) => actions.subscription.create({ plan_id: planId })}
                        onApprove={async (data) => {
                          const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken") || localStorage.getItem("token");
                          if (!token) { alert("Login first"); window.location.href = "/login"; return; }
                          const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");
                          try {
                            const res = await fetch(`${apiUrl}/paypal/verify`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ subscriptionID: data.subscriptionID })
                            });
                            const result = await res.json();
                            if (!res.ok) throw new Error(result.message);
                            window.location.href = "/dashboard?paid=1";
                          } catch (e: any) {
                            console.error(e);
                            alert("Payment verification failed, but PayPal ID saved: " + data.subscriptionID + ". Contact support.");
                          }
                        }}
                      />
                    </PayPalScriptProvider>
                  ) : (
                    <button disabled className="w-full bg-zinc-200 text-zinc-500 py-3 rounded-full">PayPal Not Configured</button>
                  )}
                </div>

                <ul className="mt-6 space-y-2 text-sm text-zinc-700">
                  {p.features.map(f => <li key={f} className="flex gap-2"><span className="text-green-600">✓</span> {f}</li>)}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}