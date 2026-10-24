"use client";
import AdminPlansPanel from "./AdminPlansPanel";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type QuoteRequest = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  company: string | null;
  service: string;
  details: string;
  source: string;
  status: string;
  createdAt: string;
};

type Payment = {
  id: string;
  orderID: string;
  planId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

type PaymentStats = {
  currency: string;
  total: number;
  completedPayments: number;
};

const quoteStatuses = ["PENDING", "REVIEWING", "QUOTED", "ACCEPTED", "DECLINED", "CLOSED"];

export default function AdminDashboardPage() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({ currency: "USD", total: 0, completedPayments: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  const loadDashboard = useCallback(async () => {
    const accessToken = sessionStorage.getItem("accessToken");
    if (!accessToken) {
      setToken("");
      setLoading(false);
      return;
    }
    setToken(accessToken);
    setError("");

    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
    if (!apiUrl) {
      setError("The API URL is not configured.");
      setLoading(false);
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [quotesResponse, paymentsResponse, statsResponse] = await Promise.all([
        fetch(`${apiUrl}/quote-requests`, { headers, cache: "no-store" }),
        fetch(`${apiUrl}/payments`, { headers, cache: "no-store" }),
        fetch(`${apiUrl}/payments/stats`, { headers, cache: "no-store" }),
      ]);

      if ([quotesResponse, paymentsResponse, statsResponse].some((response) => response.status === 401 || response.status === 403)) {
        sessionStorage.removeItem("accessToken");
        setToken("");
        throw new Error("Admin access is required. Sign in with an administrator account.");
      }
      if (!quotesResponse.ok || !paymentsResponse.ok || !statsResponse.ok) {
        throw new Error(`Could not load admin data (quotes ${quotesResponse.status}, payments ${paymentsResponse.status}, stats ${statsResponse.status}).`);
      }

      const [quoteData, paymentData, statsData] = await Promise.all([
        quotesResponse.json() as Promise<QuoteRequest[]>,
        paymentsResponse.json() as Promise<Payment[]>,
        statsResponse.json() as Promise<PaymentStats>,
      ]);
      setQuotes(quoteData);
      setPayments(paymentData);
      setPaymentStats(statsData);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadDashboard(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  async function updateStatus(id: string, status: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
    if (!apiUrl || !token) return;
    setUpdatingId(id);
    setError("");
    try {
      const response = await fetch(`${apiUrl}/quote-requests/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const body: unknown = await response.json();
        const message = typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
          ? body.message
          : `Could not update quote status (${response.status}).`;
        throw new Error(message);
      }
      setQuotes((current) => current.map((quote) => quote.id === id ? { ...quote, status } : quote));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update quote status.");
    } finally {
      setUpdatingId("");
    }
  }

  async function logout() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
    let logoutError = "";
    if (apiUrl && token) {
      try {
        const response = await fetch(`${apiUrl}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          logoutError = `Could not revoke the server session (${response.status}); the token was removed from this browser.`;
        }
      } catch {
        logoutError = "Could not reach the API to revoke the server session; the token was removed from this browser.";
      }
    }
    sessionStorage.removeItem("accessToken");
    setToken("");
    setQuotes([]);
    setPayments([]);
    setPaymentStats({ currency: "USD", total: 0, completedPayments: 0 });
    setError(logoutError);
  }

  if (loading) {
    return <div className="max-w-7xl mx-auto px-6 py-16" role="status">Loading admin data…</div>;
  }

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold">Admin sign-in required</h1>
          <p className="mt-3 text-slate-600">Sign in with an account that has administrator access to view quote requests and payment records.</p>
          {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
          <Link href="/login" className="mt-6 inline-block rounded-md bg-[#0F172A] px-6 py-3 font-semibold text-white">Sign in</Link>
        </section>
      </div>
    );
  }

  const pendingQuotes = quotes.filter((quote) => quote.status === "PENDING").length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-[240px]">
          <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs font-semibold">Admin</p>
          <h1 className="mt-2 text-4xl font-bold">Operations dashboard</h1>
          <p className="mt-3 text-slate-600">Live quote requests and PayPal captures from the application database.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto lg:max-w-[60%]">
          <Link href="/admin/projects" className="rounded-md border border-slate-300 px-4 py-2 font-semibold">Project center</Link>
          <Link href="/admin/ai-center" className="rounded-md border border-slate-300 px-4 py-2 font-semibold">AI Center</Link>
          <Link href="/admin/analytics" className="rounded-md border border-slate-300 px-4 py-2 font-semibold">Analytics</Link>
          <Link href="/admin/integrations" className="rounded-md border border-slate-300 px-4 py-2 font-semibold">Integrations</Link>
          <Link href="/admin/settings" className="rounded-md border border-slate-300 px-4 py-2 font-semibold">System Settings</Link>
          <Link href="/admin/users" className="rounded-md border border-slate-300 px-4 py-2 font-semibold">Users & Access</Link>
          <Link href="/admin/activity" className="rounded-md border border-slate-300 px-4 py-2 font-semibold">Activity Log</Link>
          <Link href="/admin/content" className="rounded-md border border-[#D4AF37] bg-[#FFFBEB] px-4 py-2 font-semibold">Content Management</Link>
          <button type="button" onClick={() => { setLoading(true); void loadDashboard(); }} className="rounded-md border border-slate-300 px-4 py-2 font-semibold">Refresh</button>
          <button type="button" onClick={() => { void logout(); }} className="rounded-md bg-[#0F172A] px-4 py-2 font-semibold text-white">Sign out</button>
        </div>
      </div>

      {error && <p role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Pending enquiries", value: pendingQuotes.toString() },
          { label: "Total enquiries", value: quotes.length.toString() },
          { label: "Completed payments", value: (paymentStats?.completedPayments ?? 0).toString() },
          { label: "Revenue", value: new Intl.NumberFormat("en-US", { style: "currency", currency: (paymentStats?.currency ?? 'USD') }).format(paymentStats.total) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-xl font-bold">Quote requests</h2>
          <p className="mt-1 text-sm text-slate-500">Most recent 100 enquiries</p>
        </div>
        {quotes.length === 0 ? (
          <p className="p-8 text-slate-500">No quote requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3">Received</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Service / details</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody>
                {quotes.map((quote) => (
                  <tr key={quote.id} className="border-t border-slate-100 align-top">
                    <td className="whitespace-nowrap px-4 py-4">{new Date(quote.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-4">
                      <div className="font-semibold">{quote.fullName}</div>
                      <a href={`mailto:${quote.email}`} className="text-[#0F172A] underline">{quote.email}</a>
                      {quote.phone && <div>{quote.phone}</div>}
                      {quote.company && <div className="text-slate-500">{quote.company}</div>}
                    </td>
                    <td className="max-w-md px-4 py-4">
                      <div className="font-medium">{quote.service}</div>
                      <p className="mt-1 whitespace-pre-wrap text-slate-600">{quote.details}</p>
                      <p className="mt-1 text-xs text-slate-400">Source: {quote.source}</p>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        aria-label={`Status for quote from ${quote.fullName}`}
                        value={quote.status}
                        disabled={updatingId === quote.id}
                        onChange={(event) => { void updateStatus(quote.id, event.target.value); }}
                        className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm disabled:opacity-60"
                      >
                        {quoteStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-xl font-bold">Payments</h2>
          <p className="mt-1 text-sm text-slate-500">Verified PayPal captures</p>
        </div>
        {payments.length === 0 ? (
          <p className="p-8 text-slate-500">No completed payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">PayPal order</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t border-slate-100">
                    <td className="whitespace-nowrap px-4 py-4">{new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-4 capitalize">{payment.planId}</td>
                    <td className="px-4 py-4 font-mono text-xs">{payment.orderID}</td>
                    <td className="whitespace-nowrap px-4 py-4 font-semibold">{new Intl.NumberFormat("en-US", { style: "currency", currency: payment.currency }).format(payment.amount)}</td>
                    <td className="px-4 py-4">{payment.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {/* MONEY PLAN CONTROL - FULL ADMIN BUTTONS */}
      <AdminPlansPanel />
    </div>
  );
}

