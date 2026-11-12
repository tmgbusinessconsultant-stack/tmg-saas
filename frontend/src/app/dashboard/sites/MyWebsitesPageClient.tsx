"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/project-delivery";

interface SiteListItem {
  id: string;
  name: string;
  domain?: string | null;
  subdomain?: string | null;
  status: string;
  publishedAt?: string | null;
  logoUrl?: string | null;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("accessToken")
    || localStorage.getItem("accessToken")
    || localStorage.getItem("token")
    || localStorage.getItem("access_token")
    || localStorage.getItem("authToken");
}

const PUBLIC_SITE_BASE = "https://tmgbusinessconsulting.com";

function liveUrl(site: SiteListItem): string | null {
  const rawDomain = site.domain?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (rawDomain) {
    // Generated TMG subdomain e.g. omega-7129.tmgbusinessconsulting.com has NO wildcard DNS - use /s/ path
    if (rawDomain.endsWith(".tmgbusinessconsulting.com")) {
      const sub = rawDomain.replace(".tmgbusinessconsulting.com", "");
      return `${PUBLIC_SITE_BASE}/s/${sub}`;
    }
    return `https://${rawDomain}`;
  }
  if (site.subdomain) return `${PUBLIC_SITE_BASE}/s/${site.subdomain}`;
  return null;
}

function statusLabel(status: string) {
  if (status === "PUBLISHED") return { text: "Live", cls: "bg-emerald-100 text-emerald-800" };
  if (status === "DRAFT") return { text: "In Progress", cls: "bg-amber-100 text-amber-800" };
  return { text: status, cls: "bg-zinc-100 text-zinc-700" };
}

export default function MyWebsitesPage() {
  const [sites, setSites] = useState<SiteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const token = getToken();
      if (!token) throw new Error("Sign in to view your websites.");
      const data = await apiRequest<SiteListItem[]>("/sites", token);
      if (active) setSites(data);
    };
    void load()
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : "Could not load websites."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <main className="p-10">Loading your websites…</main>;
  if (error) return <main role="alert" className="p-10 text-red-800">{error}</main>;

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900">My Websites</h1>
          <p className="mt-2 text-sm text-zinc-500">Websites we built and manage for you.</p>
        </div>
        <Link href="/dashboard" className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold">Back to My Projects</Link>
      </div>
      {sites.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-zinc-300 bg-white p-10 text-center">
          <h2 className="text-xl font-bold">You don&apos;t have a website yet</h2>
          <p className="mt-2 text-sm text-zinc-500">Request one and we&apos;ll design, build and publish it for you.</p>
          <Link href="/quote" className="mt-6 inline-block rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white">Request a Website</Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sites.map((site) => {
            const badge = statusLabel(site.status);
            const url = liveUrl(site);
            const isLive = site.status === "PUBLISHED";
            return (
              <article key={site.id} className="rounded-[24px] border border-zinc-200 bg-white p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {site.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={site.logoUrl} alt="" className="h-11 w-11 rounded-xl object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-lg font-bold text-white">{site.name.slice(0, 1).toUpperCase()}</div>
                    )}
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900">{site.name}</h2>
                      <p className="text-sm text-zinc-500">{site.domain || (site.subdomain ? `${site.subdomain} - preview link` : "No domain yet")}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.cls}`}>{badge.text}</span>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {url && (
                    <a href={url} target="_blank" rel="noreferrer" className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white">
                      {isLive ? "Visit Live Site" : "Preview"}
                    </a>
                  )}
                  <Link href={`/dashboard/sites/${site.id}`} className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold">View Analytics</Link>
                  <Link href="/dashboard" className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold">Request Changes</Link>
                </div>
                {site.publishedAt && <p className="mt-3 text-xs text-zinc-400">Published {new Date(site.publishedAt).toLocaleDateString()}</p>}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}


