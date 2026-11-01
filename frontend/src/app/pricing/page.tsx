"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PayPalScriptProvider = dynamic(() => import("@paypal/react-paypal-js").then(module => module.PayPalScriptProvider), { ssr: false });
const PayPalButtons = dynamic(() => import("@paypal/react-paypal-js").then(module => module.PayPalButtons), { ssr: false });

const PAYPAL_PLANS = {
  starter: { monthly: "P-6JD50850NE6749845NLPPESI", annual: "P-75J29224C3625300JNLPPPSI", name: "Starter", priceM: 27.20, priceY: 272, qarM: 99, count: "1 AI Tool", limit: "10 docs/month", features: ["1 AI tool", "Basic CV Builder", "Business Assistant", "Email support"], popular: false },
  pro: { monthly: "P-6JB47037J1H7198935NLPP4AI", annual: "P-4KL53403RN578542RNLPQA5Q", name: "Pro", priceM: 82, priceY: 820, qarM: 299, count: "All 6 AI Tools", limit: "100 docs/month", features: ["All 6 AI tools", "CV + Business Plan", "Document Review", "Risk & SOP", "Priority support"], popular: true },
  business: { monthly: "P-01J52058YU3S05116NLPQF6Q", annual: "P-48A98289TE6078010NLPQJSQ", name: "Business", priceM: 274, priceY: 2740, qarM: 999, count: "All AI Tools + Expert", limit: "1000 docs/month", features: ["Everything in Pro", "Human expert review", "SOP & Policy pack", "1-on-1 consultation", "Market-specific review"], popular: false },
} as const;

const WEBSITE_PLANS = {
  starter: { name: "Starter", priceY: 27.20, priceYQAR: 99, sites: "1 Website Live", domain: "TMG Subdomain", features: ["1 Website Live (yoursite.tmg.qa)", "Basic Views Counter", "SSL & Hosting Included", "Email Support", "Mobile Ready"], popular: false, btn: "Start with Starter" },
  pro: { name: "Pro", priceY: 82, priceYQAR: 299, sites: "5 Websites Live", domain: "Custom Domain Ready", features: ["5 Websites Live", "Custom Domain + Free SSL", "Analytics and lead reporting", "Lead Export CSV", "Priority Support"], popular: true, btn: "Get Pro — Go Live Today" },
  business: { name: "Business", priceY: 274, priceYQAR: 999, sites: "Unlimited Websites", domain: "White Label", features: ["Unlimited Websites", "Remove TMG Branding", "Team Access (3 users)", "Custom Domain + SSL Free", "24/7 WhatsApp Support", "Done-For-You Setup"], popular: false, btn: "Get Business — Agency" },
} as const;

type PlanKey = keyof typeof PAYPAL_PLANS;

function apiBaseUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").trim().replace(/\/+$/, "");
  return configured.endsWith("/api") ? configured : `${configured}/api`;
}

function getSessionIdentity(): { token: string; userId: string } | null {
  const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken") || localStorage.getItem("token");
  if (!token) return null;

  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return null;
    const normalizedPayload = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalizedPayload)) as { sub?: unknown };
    return typeof payload.sub === "string" ? { token, userId: payload.sub } : null;
  } catch {
    return null;
  }
}

export default function PricingPage() {
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [productTab, setProductTab] = useState<"ai" | "website">("website");
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-center text-4xl font-black">Pricing — Simple &amp; Transparent</h1>
        <p className="mb-6 text-center text-zinc-500">AI Tools billed monthly • Website Builder billed yearly — No hidden fees • Hosted in Qatar</p>

        <div className="mb-8 flex justify-center">
          <div className="flex gap-1 rounded-full bg-zinc-900 p-1.5">
            <button onClick={() => setProductTab("ai")} className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all ${productTab === "ai" ? "bg-white text-black shadow" : "text-white/70 hover:text-white"}`}>🤖 AI Tools</button>
            <button onClick={() => setProductTab("website")} className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all ${productTab === "website" ? "bg-[#D4AF37] text-black shadow" : "text-white/70 hover:text-white"}`}>🌐 Website Builder</button>
          </div>
        </div>

        {productTab === "ai" && (
          <>
            <div className="mb-10 flex justify-center">
              <div className="flex rounded-full border bg-zinc-100 p-1">
                <button onClick={() => setBilling("monthly")} className={`rounded-full px-7 py-2.5 text-sm font-semibold ${billing === "monthly" ? "bg-zinc-900 text-white" : "text-zinc-500"}`}>Monthly — 7 Day Trial</button>
                <button onClick={() => setBilling("annual")} className={`rounded-full px-7 py-2.5 text-sm font-semibold ${billing === "annual" ? "bg-zinc-900 text-white" : "text-zinc-500"}`}>Annual — Save 20%</button>
              </div>
            </div>
            {!clientId && <div className="mb-6 rounded-lg bg-red-50 p-3 text-center text-red-600">Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID</div>}
            <div className="grid gap-6 md:grid-cols-3">
              {(Object.keys(PAYPAL_PLANS) as PlanKey[]).map(key => {
                const plan = PAYPAL_PLANS[key];
                const price = billing === "monthly" ? plan.priceM : plan.priceY;
                const planId = billing === "monthly" ? plan.monthly : plan.annual;
                return (
                  <div key={key} className={`flex flex-col rounded-[24px] border bg-white p-7 ${plan.popular ? "border-zinc-900 shadow-xl md:-translate-y-2" : "border-zinc-200"}`}>
                    {plan.popular && <div className="mb-4 self-start rounded-full bg-[#D4AF37] px-3 py-1 text-[10px] font-bold uppercase text-black">Most Popular</div>}
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="mt-1 text-sm text-zinc-500">{plan.count} • {plan.limit}</p>
                    <div className="mt-5 flex items-baseline gap-1"><span className="text-4xl font-bold">${price}</span><span className="text-sm text-zinc-500">/{billing === "monthly" ? "mo" : "yr"}</span></div>
                    <p className="mt-1 text-xs text-zinc-400">QAR {plan.qarM}/mo • PayPal Secure</p>
                    <div className="mt-6">
                      {clientId ? (
                        <PayPalScriptProvider options={{ clientId, vault: true, intent: "subscription", currency: "USD" }}>
                          <PayPalButtons
                            style={{ layout: "vertical", color: "gold", shape: "pill", label: "subscribe" }}
                            createSubscription={(_data, actions) => {
                              const identity = getSessionIdentity();
                              if (!identity) {
                                router.push("/login");
                                throw new Error("Sign in before starting a PayPal subscription.");
                              }
                              return actions.subscription.create({
                                plan_id: planId,
                                custom_id: identity.userId,
                              });
                            }}
                            onApprove={async data => {
                              const identity = getSessionIdentity();
                              if (!identity) {
                                alert("Sign in to complete subscription verification.");
                                router.push("/login");
                                return;
                              }
                              const token = identity.token;
                              try {
                                const response = await fetch(`${apiBaseUrl()}/paypal/verify`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                  body: JSON.stringify({ subscriptionID: data.subscriptionID }),
                                });
                                const result: unknown = await response.json();
                                if (!response.ok) {
                                  const message = typeof result === "object" && result !== null && "message" in result && typeof result.message === "string"
                                    ? result.message
                                    : "Subscription verification failed.";
                                  throw new Error(message);
                                }
                                router.push("/dashboard?paid=1");
                              } catch (error: unknown) {
                                console.error("PayPal subscription verification failed.", error);
                                alert(`Payment was approved but could not be verified. Contact support with subscription ID: ${data.subscriptionID || "unavailable"}`);
                              }
                            }}
                          />
                        </PayPalScriptProvider>
                      ) : <button disabled className="w-full rounded-full bg-zinc-200 py-3 text-zinc-500">PayPal Not Configured</button>}
                    </div>
                    <ul className="mt-6 space-y-2 text-sm text-zinc-700">{plan.features.map(feature => <li key={feature} className="flex gap-2"><span className="text-green-600">✓</span> {feature}</li>)}</ul>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {productTab === "website" && (
          <>
            <div className="mb-8 rounded-[20px] bg-[#0F172A] p-6 text-white">
              <h2 className="text-xl font-black">🌐 Website Builder — Your website live in 10 minutes</h2>
              <p className="mt-1 text-sm text-white/70">Hosting, SSL, analytics and support included.</p>
              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-xl bg-white/10 p-3"><div className="text-[11px] uppercase text-white/50">Step 1</div><div className="text-sm font-bold">Choose Plan &amp; Pay Yearly</div><div className="mt-1 text-xs text-white/60">Secure PayPal • Invoice instantly</div></div>
                <div className="rounded-xl bg-white/10 p-3"><div className="text-[11px] uppercase text-white/50">Step 2</div><div className="text-sm font-bold">Create in 10 Minutes</div><div className="mt-1 text-xs text-white/60">Template → Add business info</div></div>
                <div className="rounded-xl bg-white/10 p-3"><div className="text-[11px] uppercase text-white/50">Step 3</div><div className="text-sm font-bold">Publish &amp; Get Link</div><div className="mt-1 text-xs text-white/60">yoursite.tmg.qa or yourdomain.com live</div></div>
                <div className="rounded-xl bg-[#D4AF37] p-3 text-black"><div className="text-[11px] uppercase">Step 4</div><div className="text-sm font-black">Track Real Customers</div><div className="mt-1 text-xs font-medium">Analytics in your dashboard</div></div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {Object.entries(WEBSITE_PLANS).map(([key, plan]) => (
                <div key={key} className={`flex flex-col rounded-[24px] border bg-white p-7 ${plan.popular ? "border-[#0F172A] shadow-xl md:-translate-y-2" : "border-zinc-200"}`}>
                  {plan.popular && <div className="mb-4 self-start rounded-full bg-[#0F172A] px-3 py-1 text-[10px] font-bold uppercase text-white">Most Popular — For Real Business</div>}
                  <h3 className="text-xl font-black">{plan.name}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{plan.sites} • {plan.domain}</p>
                  <div className="mt-5 flex items-baseline gap-1"><span className="text-4xl font-bold">${plan.priceY}</span><span className="text-sm text-zinc-500">/yr</span></div>
                  <p className="mt-1 text-xs text-zinc-400">QAR {plan.priceYQAR}/yr — 365 days live • ~QAR {(plan.priceYQAR / 365).toFixed(2)}/day</p>
                  <div className="mt-6">
                    <Link href="/sites" className={`block w-full rounded-full py-3 text-center font-bold ${plan.popular ? "bg-[#0F172A] text-white" : "bg-zinc-900 text-white"}`}>{plan.btn} →</Link>
                    <div className="mt-2 text-center text-[11px] text-zinc-500">✓ 14-Day Money Back ✓ Cancel Anytime ✓ SSL + Hosted in Qatar</div>
                  </div>
                  <ul className="mt-6 space-y-2 text-sm text-zinc-700">{plan.features.map(feature => <li key={feature} className="flex gap-2"><span className="text-green-600">✓</span> {feature}</li>)}</ul>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border bg-zinc-50 p-6 text-center">
              <div className="font-bold">🔒 Trust &amp; Service</div>
              <div className="mt-2 flex flex-wrap justify-center gap-3 text-sm text-zinc-600">
                <span className="rounded-full border bg-white px-3 py-1">SSL Secured + Hosted in Qatar</span>
                <span className="rounded-full border bg-white px-3 py-1">Setup support available for Pro plans</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
