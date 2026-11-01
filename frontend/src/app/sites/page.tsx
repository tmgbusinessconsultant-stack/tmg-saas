"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/project-delivery";

type SiteSummary = {
  id: string;
  name: string;
  subdomain: string;
  status?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSiteSummary(value: unknown): value is SiteSummary {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.subdomain === "string" &&
    (value.status === undefined || typeof value.status === "string");
}

function readSites(value: unknown): SiteSummary[] {
  const rows = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.data) ? value.data : null;
  if (!rows || !rows.every(isSiteSummary)) throw new Error("The sites response was invalid.");
  return rows;
}

export default function SitesPage() {
  const [token, setToken] = useState("");
  const [sites, setSites] = useState<SiteSummary[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const loadSites = useCallback(async (accessToken: string) => {
    setSites(readSites(await apiRequest<unknown>("/sites", accessToken)));
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      const accessToken = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken") || localStorage.getItem("token") || "";
      if (!active) return;
      setToken(accessToken);
      if (!accessToken) {
        setError("Sign in to manage your website.");
        setLoading(false);
        return;
      }
      try {
        await loadSites(accessToken);
      } catch (loadError: unknown) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load your websites.");
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; };
  }, [loadSites]);

  async function createSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const siteName = name.trim();
    if (!siteName || !token) return;
    setCreating(true);
    setError("");
    try {
      const created = await apiRequest<unknown>("/sites", token, {
        method: "POST",
        body: JSON.stringify({ name: siteName }),
      });
      if (!isSiteSummary(created)) throw new Error("The created site response was invalid.");
      setSites(current => [created, ...current]);
      setName("");
    } catch (createError: unknown) {
      setError(createError instanceof Error ? createError.message : "Could not create your website.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Website Builder</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">Your websites</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Create a site, edit its pages, and publish when it is ready.</p>
      </header>

      {error && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

      {!token && !loading ? (
        <Link href="/login" className="mt-6 inline-block rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Sign in</Link>
      ) : (
        <>
          <form onSubmit={createSite} className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row">
            <label htmlFor="site-name" className="sr-only">Website name</label>
            <input id="site-name" required maxLength={100} value={name} onChange={event => setName(event.target.value)} placeholder="Business or website name" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            <button type="submit" disabled={creating || loading} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
              {creating ? "Creating…" : "Create website"}
            </button>
          </form>

          <section aria-labelledby="site-list-heading" className="mt-10">
            <h2 id="site-list-heading" className="text-lg font-semibold">Your sites</h2>
            {loading ? (
              <p role="status" className="mt-4 text-sm text-slate-500">Loading websites…</p>
            ) : sites.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">You have not created a website yet.</p>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {sites.map(site => (
                  <li key={site.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h3 className="font-semibold text-slate-900">{site.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{site.subdomain} · {site.status || "Draft"}</p>
                    <Link href={`/builder/${encodeURIComponent(site.id)}`} className="mt-4 inline-block text-sm font-semibold text-blue-700 underline">Open website builder</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
