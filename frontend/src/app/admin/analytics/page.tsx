"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/project-delivery";

type Analytics = {
  periodDays: number;
  search: { totalSearches: number; failedSearches: number; popularSearches: Array<{ query: string; count: number }> };
  aiQuestions: number;
  activeAiSessions: number;
  quoteRequests: number;
  acceptedQuotes: number;
  completedProjects: number;
  paymentsReceived: Array<{ currency: string; count: number; amount: string }>;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const token = sessionStorage.getItem("accessToken");
      if (!token) {
        setError("Admin sign-in is required to view analytics.");
        setLoading(false);
        return;
      }
      void apiRequest<Analytics>("/ai/admin/analytics", token)
        .then(setData)
        .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load analytics."))
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Admin</p><h1 className="mt-2 text-4xl font-bold">Analytics</h1><p className="mt-2 text-slate-600">Available database metrics for the last {data?.periodDays ?? 90} days.</p></div><Link href="/admin" className="rounded-md border px-4 py-2 font-semibold">Back to dashboard</Link></div>
      {loading && <p className="mt-8" role="status">Loading analytics…</p>}
      {error && <p role="alert" className="mt-8 rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
      {data && <>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ["Search volume", data.search.totalSearches],
            ["Failed searches", data.search.failedSearches],
            ["AI questions", data.aiQuestions],
            ["AI sessions served", data.activeAiSessions],
            ["Quote requests", data.quoteRequests],
            ["Accepted quotes", data.acceptedQuotes],
            ["Completed projects", data.completedProjects],
            ["Completed payments", data.paymentsReceived.reduce((total, item) => total + item.count, 0)],
          ].map(([label, value]) => <div key={label} className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>)}
        </div>
        {data.paymentsReceived.map((payment) => <div key={payment.currency} className="mt-4 rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Payments received ({payment.currency})</p><p className="mt-2 text-3xl font-bold">{new Intl.NumberFormat(undefined, { style: "currency", currency: payment.currency }).format(Number(payment.amount))}</p><p className="mt-1 text-sm text-slate-500">{payment.count} completed payments</p></div>)}
        <section className="mt-8 rounded-xl border bg-white p-5">
          <h2 className="text-xl font-bold">Popular searches</h2>
          {data.search.popularSearches.length ? <ol className="mt-4 space-y-2">{data.search.popularSearches.map((item) => <li key={item.query} className="flex justify-between border-b py-2"><span>{item.query}</span><span className="font-semibold">{item.count}</span></li>)}</ol> : <p className="mt-3 text-slate-500">No search analytics yet.</p>}
        </section>
        <p className="mt-5 text-sm text-slate-500">Outstanding invoices are not shown because invoice records are not implemented in this project. Revenue is limited to recorded completed payments.</p>
      </>}
    </main>
  );
}




