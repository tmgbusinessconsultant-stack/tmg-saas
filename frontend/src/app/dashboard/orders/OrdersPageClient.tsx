"use client";
import { useState } from "react";
import Link from "next/link";
type OrderValue = string | number | boolean | null | undefined;
type Order = Record<string, OrderValue>;
function loadOrders(): Order[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = sessionStorage.getItem("tmg-last-order");
    const list: Order[] = raw ? [JSON.parse(raw) as Order] : [];
    const pending = sessionStorage.getItem("tmg-pending-order");
    if (pending) list.unshift(JSON.parse(pending) as Order);
    return list;
  } catch { return []; }
}
export default function OrdersPage() {
  const [orders] = useState<Order[]>(loadOrders);
  const [loaded] = useState(true);
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black">My Orders</h1>
      <p className="mt-2 text-sm text-zinc-500">Shop + SecureFind + consultation orders you placed while signed in.</p>
      {!loaded ? <p className="mt-8 text-sm">Loading...</p> : orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border bg-white p-8 text-center">
          <p className="font-semibold">No orders yet</p>
          <p className="mt-1 text-sm text-zinc-500">Your PayPal orders will appear here after checkout.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/shop" className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white">Browse Shop</Link>
            <Link href="/pricing" className="rounded-full border px-5 py-2.5 text-sm font-semibold">See Plans</Link>
          </div>
        </div>
      ) : orders.map((o, i) => (
        <div key={i} className="mt-4 rounded-2xl border bg-white p-5">
          <p className="font-bold">{o.title || o.plan || "Order"}</p>
          <p className="text-sm text-zinc-500">{o.orderId || o.id || ""} - {o.amount || o.total || ""} {o.currency || "USD"}</p>
          <p className="text-xs text-zinc-400">{o.createdAt || o.date || ""} - {o.status || "Completed"}</p>
        </div>
      ))}
      <Link href="/dashboard" className="mt-6 inline-block text-sm underline">Back to My Projects</Link>
    </div>
  );
}




