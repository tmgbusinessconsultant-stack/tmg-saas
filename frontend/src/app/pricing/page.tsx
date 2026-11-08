"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PayPalScriptProvider = dynamic(() => import("@paypal/react-paypal-js").then(module => module.PayPalScriptProvider), { ssr: false });
const PayPalButtons = dynamic(() => import("@paypal/react-paypal-js").then(module => module.PayPalButtons), { ssr: false });

const PAYPAL_PLANS = {
  starter: { monthly: "P-0MC96026NA2716644NLXO3WA", annual: "P-6E812386LU2064505NLXO3WI", name: "Starter", priceM: 27.20, priceY: 272, qarM: 99, count: "1 AI Tool", limit: "10 docs/month", features: ["1 AI tool", "Basic CV Builder", "Business Assistant", "Email support"], popular: false },
  pro: { monthly: "P-7GT73673K01656641NLXO3WQ", annual: "P-5TS76549YR3395419NLXO3WQ", name: "Pro", priceM: 82.14, priceY: 821.40, qarM: 299, count: "All 6 AI Tools", limit: "100 docs/month", features: ["All 6 AI tools", "CV + Business Plan", "Document Review", "Risk & SOP", "Priority support"], popular: true },
  business: { monthly: "P-7JV69040VT147715NNLXO3WY", annual: "P-18W458537Y9351232NLXO3WY", name: "Business", priceM: 274.45, priceY: 2744.50, qarM: 999, count: "All AI Tools + Expert", limit: "1000 docs/month", features: ["Everything in Pro", "Human expert review", "SOP & Policy pack", "1-on-1 consultation", "Market-specific review"], popular: false },
} as const;

const WEBSITE_PLANS = {
  starter: { name: "Starter", priceY: 27.20, priceYQAR: 99, sites: "1 Website Live", domain: "TMG Subdomain", features: ["1 Website Live (yoursite.tmg.qa)", "Basic Views Counter", "SSL & Hosting Included", "Email Support", "Mobile Ready"], popular: false, btn: "Start with Starter" },
  pro: { name: "Pro", priceY: 82.14, priceYQAR: 299, sites: "5 Websites Live", domain: "Custom Domain Ready", features: ["5 Websites Live", "Custom Domain + Free SSL", "Analytics and lead reporting", "Lead Export CSV", "Priority Support"], popular: true, btn: "Get Pro — Go Live Today" },
  business: { name: "Business", priceY: 274.45, priceYQAR: 999, sites: "Unlimited Websites", domain: "White Label", features: ["Unlimited Websites", "Remove TMG Branding", "Team Access (3 users)", "Custom Domain + SSL Free", "24/7 WhatsApp Support", "Done-For-You Setup"], popular: false, btn: "Get Business — Agency" },
} as const;

type PlanKey = keyof typeof PAYPAL_PLANS;

function apiBaseUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").trim().replace(/\/+$/, "");
  return configured.replace(/\/api$/i, "") + "/api";
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
  const [paypalReady, setPaypalReady] = useState(false);
  const paypalSectionRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  useEffect(() => {
    const section = paypalSectionRef.current;
    if (productTab !== "ai" || paypalReady || !section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPaypalReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [paypalReady, productTab]);

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-center text-4xl font-black">Pricing — Simple &amp; Transparent</h1>
        <p className="mb-6 text-center text-zinc-500">AI Tools billed monthly • Website Builder billed yearly — No hidden fees • Hosted in Qatar</p>

        <div className="mb-8 flex justify-center">
          <div className="flex w-full max-w-md rounded-full bg-zinc-100 p-1">
            <button onClick={() => setProductTab("ai")} className={`flex-1 whitespace-nowrap rounded-full px-3 py-2.5 text-[13px] font-bold transition-all ${productTab === "ai" ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900"}`}>🤖 AI Tools</button>
            <button onClick={() => setProductTab("website")} className={`flex-1 whitespace-nowrap rounded-full px-3 py-2.5 text-[13px] font-bold transition-all ${productTab === "website" ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900"}`}>🌐 Website Builder</button>
          </div>
        </div>

        {productTab === "ai" && (
          <>
            <div className="mb-10 flex justify-center">
              <div className="flex w-full max-w-md rounded-full bg-zinc-100 p-1">
                <button onClick={() => setBilling("monthly")} className={`flex-1 whitespace-nowrap rounded-full px-3 py-2.5 text-[13px] font-semibold transition-all ${billing === "monthly" ? "bg-zinc-900 text-white" : "text-zinc-500"}`}>Monthly — 7 Day Trial</button>
                <button onClick={() => setBilling("annual")} className={`flex-1 whitespace-nowrap rounded-full px-3 py-2.5 text-[13px] font-semibold transition-all ${billing === "annual" ? "bg-zinc-900 text-white" : "text-zinc-500"}`}>Annual — Save 20%</button>
              </div>
            </div>
            {!clientId && <div className="mb-6 rounded-lg bg-red-50 p-3 text-center text-red-600">Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID</div>}
            <div ref={paypalSectionRef} className="grid gap-6 md:grid-cols-3">
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
                    
                    <div className="mt-6">
                      {clientId && paypalReady ? (
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
                      ) : clientId ? (
                        <div className="w-full rounded-full bg-zinc-100 py-3 text-center text-sm text-zinc-500">PayPal loads when this section is in view</div>
                      ) : <button disabled className="w-full rounded-full bg-zinc-200 py-3 text-zinc-500">PayPal Not Configured</button>}
                    </div>
                    <p className="mt-3 text-center text-[11px] leading-4 text-zinc-500">By subscribing you agree to our <a href="/terms" className="font-semibold text-zinc-700 underline">Terms &amp; Refund Policy</a>. Digital downloads: No refund after download, 7 days if file defective.</p>
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
              <h2 className="text-xl font-black" style={{ color: "#FFFFFF" }}>🌐 Website Builder — Your website live in 10 minutes</h2>
              <p className="mt-1 text-sm text-white font-medium" style={{ color: "#FFFFFF" }}>Hosting, SSL, analytics and support included.</p>
              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-xl bg-white/10 p-3"><div className="text-[11px] uppercase text-white font-bold" style={{ color: "#FFFFFF" }}>Step 1</div><div className="text-sm font-bold" style={{ color: "#FFFFFF" }}>Choose Plan &amp; Pay Yearly</div><div className="mt-1 text-xs text-white font-medium" style={{ color: "#FFFFFF" }}>Secure PayPal • Invoice instantly</div></div>
                <div className="rounded-xl bg-white/10 p-3"><div className="text-[11px] uppercase text-white font-bold" style={{ color: "#FFFFFF" }}>Step 2</div><div className="text-sm font-bold" style={{ color: "#FFFFFF" }}>Create in 10 Minutes</div><div className="mt-1 text-xs text-white font-medium" style={{ color: "#FFFFFF" }}>Template → Add business info</div></div>
                <div className="rounded-xl bg-white/10 p-3"><div className="text-[11px] uppercase text-white font-bold" style={{ color: "#FFFFFF" }}>Step 3</div><div className="text-sm font-bold" style={{ color: "#FFFFFF" }}>Publish &amp; Get Link</div><div className="mt-1 text-xs text-white font-medium" style={{ color: "#FFFFFF" }}>yoursite.tmg.qa or yourdomain.com live</div></div>
                <div className="rounded-xl bg-[#D4AF37] p-3 text-black"><div className="text-[11px] uppercase">Step 4</div><div className="text-sm font-black">Track Real Customers</div><div className="mt-1 text-xs font-medium" style={{ color: "#000000" }}>Analytics in your dashboard</div></div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {Object.entries(WEBSITE_PLANS).map(([key, plan]) => (
                <div key={key} className={`flex flex-col rounded-[24px] border bg-white p-7 ${plan.popular ? "border-[#0F172A] shadow-xl md:-translate-y-2" : "border-zinc-200"}`}>
                  {plan.popular && <div className="mb-4 self-start rounded-full bg-[#0F172A] px-3 py-1 text-[10px] font-bold uppercase text-white">Most Popular — For Real Business</div>}
                  <h3 className="text-xl font-black">{plan.name}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{plan.sites} • {plan.domain}</p>
                  <div className="mt-5 flex items-baseline gap-1"><span className="text-4xl font-bold">${plan.priceY}</span><span className="text-sm text-zinc-500">/yr</span></div>
                  
                  <div className="mt-6">
                    <Link href="/sites" className={`block w-full rounded-full py-3 text-center font-bold ${plan.popular ? "bg-[#0F172A] text-white" : "bg-zinc-900 text-white"}`}>{plan.btn} →</Link>
                    
                  </div>
                    <p className="mt-3 text-center text-[11px] leading-4 text-zinc-500">By subscribing you agree to our <a href="/terms" className="font-semibold text-zinc-700 underline">Terms &amp; Refund Policy</a>. Digital downloads: No refund after download, 7 days if file defective.</p>
                  <ul className="mt-6 space-y-2 text-sm text-zinc-700">{plan.features.map(feature => <li key={feature} className="flex gap-2"><span className="text-green-600">✓</span> {feature}</li>)}</ul>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border bg-zinc-50 p-6 text-center">
              <div className="font-bold">🔒 Trust &amp; Service</div>
              <div className="mt-2 flex flex-wrap justify-center gap-3 text-sm text-zinc-600">
                <span className="rounded-full border bg-white px-3 py-1">✓ 14-Day Money Back</span><span className="rounded-full border bg-white px-3 py-1">✓ Cancel Anytime</span><span className="rounded-full border bg-white px-3 py-1">✓ SSL Secured + Hosted in Qatar</span><span className="rounded-full border bg-white px-3 py-1">✓ No Hidden Fees</span>
                
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}







