"use client";

import { use, useEffect, useState } from "react";

interface FormStat {
  id: string;
  name: string;
  views: number;
  submissions: number;
  conversion: number;
}

interface DailyView {
  date: string;
  count: number;
}

interface SiteStats {
  totalViews: number;
  todayViews: number;
  weekViews: number;
  totalSubs: number;
  formStats: FormStat[];
  daily: DailyView[];
}

interface Lead {
  id: string;
  createdAt: string;
  data: unknown;
  form: { name: string };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFormStat(value: unknown): value is FormStat {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.name === "string"
    && typeof value.views === "number"
    && typeof value.submissions === "number"
    && typeof value.conversion === "number";
}

function isDailyView(value: unknown): value is DailyView {
  return isRecord(value) && typeof value.date === "string" && typeof value.count === "number";
}

function isSiteStats(value: unknown): value is SiteStats {
  return isRecord(value)
    && typeof value.totalViews === "number"
    && typeof value.todayViews === "number"
    && typeof value.weekViews === "number"
    && typeof value.totalSubs === "number"
    && Array.isArray(value.formStats)
    && value.formStats.every(isFormStat)
    && Array.isArray(value.daily)
    && value.daily.every(isDailyView);
}

function isLead(value: unknown): value is Lead {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.createdAt === "string"
    && isRecord(value.form)
    && typeof value.form.name === "string";
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("accessToken")
    || localStorage.getItem("accessToken")
    || localStorage.getItem("token")
    || localStorage.getItem("access_token")
    || localStorage.getItem("authToken");
}

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/+$/, "");

export default function SiteAnalyticsPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = use(params);
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    const headers = new Headers();
    const loadAnalytics = async () => {
      const token = getToken();
      if (!token) throw new Error("Sign in to view this site's analytics.");
      headers.set("Authorization", `Bearer ${token}`);

      const [statsResponse, leadsResponse] = await Promise.all([
        fetch(`${API}/sites/${encodeURIComponent(siteId)}/analytics`, { headers }),
        fetch(`${API}/sites/${encodeURIComponent(siteId)}/submissions`, { headers }),
      ]);
      if (!statsResponse.ok) throw new Error(`Analytics request failed (${statsResponse.status}).`);
      if (!leadsResponse.ok) throw new Error(`Submission request failed (${leadsResponse.status}).`);

      const statsData: unknown = await statsResponse.json();
      const leadsData: unknown = await leadsResponse.json();
      if (!isSiteStats(statsData)) throw new Error("The analytics response has an invalid shape.");
      if (!Array.isArray(leadsData) || !leadsData.every(isLead)) {
        throw new Error("The submissions response has an invalid shape.");
      }

      if (active) {
        setStats(statsData);
        setLeads(leadsData);
      }
    };

    void Promise.resolve()
      .then(loadAnalytics)
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load analytics.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [siteId]);

  if (loading) return <main className="p-10">Loading analytics…</main>;
  if (error) return <main role="alert" className="p-10 text-red-800">{error}</main>;
  if (!stats) return <main className="p-10">Analytics are unavailable.</main>;

  const filteredLeads = leads.filter((lead) => JSON.stringify(lead.data).toLowerCase().includes(query.toLowerCase()));

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6 sm:p-8">
      <h1 className="text-3xl font-black">Site analytics — {siteId.slice(0, 8)}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total views" value={stats.totalViews} />
        <Metric label="Today" value={stats.todayViews} />
        <Metric label="This week" value={stats.weekViews} />
        <Metric label="Form submissions" value={stats.totalSubs} />
      </div>

      <section>
        <h2 className="mb-4 text-xl font-bold">Form performance</h2>
        {stats.formStats.length === 0 ? <p className="text-sm text-slate-500">No forms have been created for this site.</p> : (
          <div className="grid gap-3">
            {stats.formStats.map((form) => (
              <article key={form.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4">
                <div><h3 className="font-bold">{form.name}</h3><p className="font-mono text-xs text-slate-500">{form.id}</p></div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span>{form.views} views</span>
                  <span>{form.submissions} submissions</span>
                  <span className="rounded-full bg-black px-3 py-1 font-bold text-white">{form.conversion}% conversion</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Daily views (7 days)</h2>
        {stats.daily.length === 0 ? <p className="text-sm text-slate-500">No views recorded yet.</p> : (
          <div className="flex h-28 items-end gap-2">
            {stats.daily.map((day) => (
              <div key={day.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <div className="w-full rounded bg-black" style={{ height: `${Math.max(4, day.count * 15)}px` }} />
                <time className="text-[10px]" dateTime={day.date}>{new Date(day.date).toLocaleDateString().slice(0, 5)}</time>
                <span className="text-xs font-bold">{day.count}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Submissions ({filteredLeads.length})</h2>
          <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search submissions" placeholder="Search submissions…" className="w-full rounded-lg border p-2 sm:w-64" />
        </div>
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="p-3 text-left">Form</th><th className="p-3 text-left">Data</th><th className="p-3 text-left">Date</th></tr></thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-t">
                  <td className="p-3">{lead.form.name}</td>
                  <td className="break-all p-3 font-mono text-xs">{JSON.stringify(lead.data)}</td>
                  <td className="whitespace-nowrap p-3 text-xs">{new Date(lead.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLeads.length === 0 && <p className="p-6 text-center text-slate-500">No matching submissions.</p>}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <article className="rounded-2xl border p-5"><p className="text-xs text-gray-500">{label}</p><p className="text-3xl font-black">{value}</p></article>;
}
