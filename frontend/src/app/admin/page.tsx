"use client";
import AdminPlansPanel from "./AdminPlansPanel";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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

function getToken() {
  if (typeof window === "undefined") return "";
  return (
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    ""
  );
}

export default function AdminDashboardPage() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({ currency: "USD", total: 0, completedPayments: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  const [quoteSearch, setQuoteSearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<string>("ALL");

  const loadDashboard = useCallback(async () => {
    const accessToken = getToken();
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

      if ([quotesResponse, paymentsResponse, statsResponse].some((r) => r.status === 401 || r.status === 403)) {
        sessionStorage.removeItem("accessToken");
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        setToken("");
        throw new Error("Admin access required. Sign in again.");
      }
      if (!quotesResponse.ok || !paymentsResponse.ok || !statsResponse.ok) {
        throw new Error(`Load failed (quotes ${quotesResponse.status}, payments ${paymentsResponse.status}, stats ${statsResponse.status})`);
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
    try {
      const saved = localStorage.getItem("tmg_colors");
      if (saved) {
        const c = JSON.parse(saved);
        if (c.headerBg === "#FFFFFF" || c.headerBg === "#ffffff" || c.headerBg === "white" || c.bg === "#FFFFFF") {
          localStorage.removeItem("tmg_colors");
        }
      }
    } catch {}
    const timer = window.setTimeout(() => { void loadDashboard(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      if (quoteStatusFilter !== "ALL" && q.status !== quoteStatusFilter) return false;
      if (!quoteSearch) return true;
      const s = quoteSearch.toLowerCase();
      return `${q.fullName} ${q.email} ${q.company} ${q.service} ${q.details}`.toLowerCase().includes(s);
    });
  }, [quotes, quoteSearch, quoteStatusFilter]);

  const filteredPayments = useMemo(() => {
    if (!paymentSearch) return payments;
    const s = paymentSearch.toLowerCase();
    return payments.filter(p => `${p.orderID} ${p.planId} ${p.status}`.toLowerCase().includes(s));
  }, [payments, paymentSearch]);

  async function updateStatus(id: string, status: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
    if (!apiUrl || !token) return;
    setUpdatingId(id); setError("");
    try {
      const response = await fetch(`${apiUrl}/quote-requests/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => ({}));
        const message = typeof body === "object" && body !== null && "message" in body && typeof (body as any).message=== "string" ? (body as any).message : `Could not update (${response.status})`;
        throw new Error(message);
      }
      setQuotes((current) => current.map((quote) => quote.id === id ? { ...quote, status } : quote));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update quote status.");
    } finally { setUpdatingId(""); }
  }

  async function deleteQuote(id: string) {
    if (!window.confirm("Delete this quote request permanently?")) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
    if (!apiUrl || !token) return;
    try {
      const res = await fetch(`${apiUrl}/quote-requests/${encodeURIComponent(id)}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Delete failed ${res.status}`);
      setQuotes((c) => c.filter(q => q.id !== id));
    } catch (e: any) { setError(e.message); }
  }

  async function logout() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
    if (apiUrl && token) {
      try { await fetch(`${apiUrl}/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }); }catch { }
    }
    sessionStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    setToken(""); setQuotes([]); setPayments([]);
    setPaymentStats({ currency: "USD", total: 0, completedPayments: 0 });
  }

  const exportQuotesCsv = () => {
    const rows = [["Date", "Name", "Email", "Phone", "Company", "Service", "Status", "Details"]];
    filteredQuotes.forEach(q => rows.push([new Date(q.createdAt).toISOString(), q.fullName, q.email, q.phone || "", q.company || "", q.service, q.status, q.details.replace(/\n/g, " ")]));
    const csv = rows.map(r => r.map(v => `"${(v || "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `quotes-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  if (loading) return <div className="max-w-7xl mx-auto px-6 py-16" role="status">Loading admin data…</div>;

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <section className="rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold">Admin sign-in required</h1>
          <p className="mt-3 text-slate-600">Sign in with an administrator account.</p>
          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
          <Link href="/login" className="mt-6 inline-block rounded-md bg-[#0F172A] px-6 py-3 font-semibold text-white">Sign in</Link>
        </section>
      </div>
    );
  }

  const pendingQuotes = quotes.filter((quote) => quote.status === "PENDING").length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs font-semibold">Admin</p>
          <h1 className="mt-2 text-4xl font-bold">Operations dashboard</h1>
          <p className="mt-3 text-slate-600">Quotes, PayPal, Money Plans — Full Control</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <Link href="/admin/superapp" className="rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg hover:from-purple-700 hover:to-indigo-700">🚀 SuperApp V7</Link>
          <Link href="/admin/settings" className="rounded-md bg-slate-800 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-slate-900">⚙️ System Settings</Link>
          <Link href="/admin/projects" className="rounded-md border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">📁 Projects</Link>
          <Link href="/admin/ai-center" className="rounded-md border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">🤖 AI Center</Link>
          <Link href="/admin/analytics" className="rounded-md border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">📊 Analytics</Link>
          <Link href="/admin/users" className="rounded-md border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">👥 Users</Link>
          <Link href="/admin/activity" className="rounded-md border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">📝 Activity</Link>
          <Link href="/admin/content" className="rounded-md border border-[#D4AF37] bg-[#FFFBEB] px-3 py-2 text-sm font-semibold hover:bg-amber-50">📝 Content</Link>
          <Link href="/admin/integrations" className="rounded-md border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">🔌 Integrations</Link>
          <button onClick={() => { setLoading(true); void loadDashboard(); }} className="rounded-md border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">🔄 Refresh</button>
          <button onClick={() => { void logout(); }} className="rounded-md bg-[#0F172A] px-3 py-2 text-sm font-semibold text-white">Sign out</button>
        </div>
      </div>

      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Pending enquiries", value: pendingQuotes.toString() },
          { label: "Total enquiries", value: quotes.length.toString() },
          { label: "Completed payments", value: (paymentStats?.completedPayments ?? 0).toString() },
          { label: "Revenue", value: new Intl.NumberFormat("en-US", { style: "currency", currency: (paymentStats?.currency ?? 'USD') }).format(paymentStats.total) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-10 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
          <div><h2 className="text-xl font-bold">Quote requests</h2><p className="text-sm text-slate-500">{filteredQuotes.length} / {quotes.length}</p></div>
          <div className="flex gap-2">
            <input value={quoteSearch} onChange={e => setQuoteSearch(e.target.value)} placeholder="Search name, email,service..." className="px-3 py-2 text-sm border rounded-lg w-64" />
            <select value={quoteStatusFilter} onChange={e => setQuoteStatusFilter(e.target.value)} className="px-3 py-2 text-sm border rounded-lg">
              <option value="ALL">All Status</option>{quoteStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={exportQuotesCsv} className="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50">ExportCSV</button>
          </div>
        </div>
        {filteredQuotes.length === 0 ? <p className="p-8 text-slate-500">No quote requests</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Service</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr></thead>
              <tbody>
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="border-t align-top">
                    <td className="whitespace-nowrap px-4 py-4">{new Date(quote.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-4"><div className="font-semibold">{quote.fullName}</div><a href={`mailto:${quote.email}`} className="underline">{quote.email}</a>{quote.phone && <div>{quote.phone}</div>}{quote.company && <div className="text-slate-500">{quote.company}</div>}</td>
                    <td className="max-w-md px-4 py-4"><div className="font-medium">{quote.service}</div><p className="mt-1 whitespace-pre-wrap text-slate-600 line-clamp-3">{quote.details}</p><p className="text-xs text-slate-400">Source:{quote.source}</p></td>
                    <td className="px-4 py-4">
                      <select value={quote.status} disabled={updatingId === quote.id} onChange={(e) => { void updateStatus(quote.id, e.target.value); }} className="rounded-md border bg-white px-2 py-2 text-sm disabled:opacity-60">
                        {quoteStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-4"><button onClick={() => void deleteQuote(quote.id)} className="text-xs text-red-600 hover:underline">Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-5">
          <div><h2 className="text-xl font-bold">Payments</h2><p className="text-sm text-slate-500">{filteredPayments.length} records</p></div>
          <input value={paymentSearch} onChange={e => setPaymentSearch(e.target.value)} placeholder="Search order, plan..." className="px-3 py-2 text-sm border rounded-lg w-64" />
        </div>
        {filteredPayments.length === 0 ? <p className="p-8 text-slate-500">No payments</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Order</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th></tr></thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-t"><td className="px-4 py-4">{new Date(payment.createdAt).toLocaleDateString()}</td><td className="px-4 py-4 capitalize">{payment.planId}</td><td className="px-4 py-4 font-mono text-xs">{payment.orderID}</td><td className="px-4 py-4 font-semibold">{new Intl.NumberFormat("en-US", { style: "currency", currency: payment.currency }).format(payment.amount)}</td><td className="px-4 py-4">{payment.status}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AdminPlansPanel />
    </div>
  );
}
