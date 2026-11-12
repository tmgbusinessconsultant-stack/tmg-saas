"use client";
import { useState } from "react";
import Link from "next/link";
type SubValue = string | number | boolean | null | undefined;
type Sub = Record<string, SubValue>;
function loadSub(): Sub | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("tmg-subscription");
    if (raw) return JSON.parse(raw) as Sub;
    const plan = localStorage.getItem("tmg-plan");
    if (plan) return { plan };
    return null;
  } catch { return null; }
}
export default function SubscriptionPage() {
  const [sub] = useState<Sub | null>(loadSub);
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black">My Subscription</h1>
      <p className="mt-2 text-sm text-zinc-500">Your TMG plan. Manage / cancel in PayPal - we never store your card.</p>
      <div className="mt-8 rounded-2xl border bg-white p-6">
        {sub ? (
          <>
            <p className="text-sm text-zinc-500">Current plan</p>
            <p className="mt-1 text-2xl font-black">{sub.plan || sub.title || "Active"}</p>
            {sub.subscriptionId && <p className="mt-2 text-sm text-zinc-500">PayPal ID: {sub.subscriptionId}</p>}
            {sub.nextBilling && <p className="text-sm text-zinc-500">Next billing: {sub.nextBilling}</p>}
            <p className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{sub.status || "Active"}</p>
          </>
        ) : (
          <>
            <p className="font-semibold">No active subscription found on this device</p>
            <p className="mt-1 text-sm text-zinc-500">If you subscribed, your plan is linked to your PayPal account. Choose a plan to start.</p>
          </>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/pricing" className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white">See Plans / Upgrade</Link>
          <a href="https://www.paypal.com/myaccount/autopay/" target="_blank" rel="noreferrer" className="rounded-full border px-5 py-2.5 text-sm font-semibold">Manage in PayPal</a>
        </div>
      </div>
      <Link href="/dashboard" className="mt-6 inline-block text-sm underline">Back to My Projects</Link>
    </div>
  );
}




