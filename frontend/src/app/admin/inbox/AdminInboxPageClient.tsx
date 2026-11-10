"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/project-delivery";

function getToken() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken") || "";
}

type InboxItem = {
  id: string;
  itemType: "FILE_UPLOAD" | "VIDEO_LINK";
  refId: string;
  projectId: string;
  projectTitle: string;
  title: string;
  subtitle: string;
  from: string;
  url: string | null;
  status: "NEW" | "SEEN" | "DELIVERED";
  createdAt: string;
};

export default function AdminInboxPage() {
  const [token] = useState(getToken);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [error, setError] = useState("");

  const load = useCallback(async (t: string) => {
    const data = await apiRequest<{ items: InboxItem[] }>("/projects/admin/inbox", t);
    setItems(data.items || []);
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const run = async () => {
      try {
        await apiRequest("/projects/admin/inbox/mark-seen", token, { method: "POST" });
        await load(token);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Could not load inbox.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void run();
    return () => { active = false; };
  }, [load, token]);

  async function setStatus(item: InboxItem, status: "NEW" | "SEEN" | "DELIVERED") {
    const type = item.itemType === "FILE_UPLOAD" ? "file" : "video";
    try {
      await apiRequest(`/projects/admin/inbox/${type}/${encodeURIComponent(item.refId)}/status`, token, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update status.");
    }
  }

  const sorted = useMemo(() => [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [items]);

  if (loading) return <main className="mx-auto max-w-6xl px-6 py-16">Loading inbox…</main>;
  if (!token) return <main className="mx-auto max-w-3xl px-6 py-16"><p>Sign in required.</p><Link href="/login" className="underline">Sign in</Link></main>;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Administration</p>
          <h1 className="mt-2 text-3xl font-bold">Inbox</h1>
          <p className="mt-2 text-sm text-slate-600">All project uploads (Option A) and video links (Option C), sorted by date. Items marked <strong>Seen</strong> when this page opens; you can set New / Seen / Delivered.</p>
        </div>
        <Link href="/admin" className="rounded-md border px-4 py-2 font-semibold">Admin dashboard</Link>
      </header>
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <section className="mt-8 overflow-hidden rounded-2xl border bg-white shadow-sm">
        {sorted.length === 0 ? <p className="p-8 text-slate-500">No inbox items yet.</p> : (
          <ul className="divide-y">
            {sorted.map((item) => (
              <li key={item.id} className="flex flex-wrap items-start justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.status === "NEW" ? "bg-blue-100 text-blue-800" : item.status === "SEEN" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{item.status}</span>
                    <span className="text-xs uppercase tracking-wide text-slate-500">{item.itemType === "FILE_UPLOAD" ? "File upload" : "Video link"}</span>
                    <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 font-semibold text-slate-900 truncate">{item.title}</p>
                  <p className="text-sm text-slate-600">{item.subtitle} · From {item.from}</p>
                  <p className="text-sm text-slate-600">Project: <Link href={`/admin/projects?projectId=${encodeURIComponent(item.projectId)}`} className="underline font-medium">{item.projectTitle}</Link> <span className="text-xs text-slate-400">({item.projectId})</span></p>
                  {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm underline break-all">{item.url}</a>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["NEW", "SEEN", "DELIVERED"] as const).map((s) => (
                    <button key={s} type="button" onClick={() => void setStatus(item, s)} className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${item.status === s ? "bg-zinc-900 text-white border-zinc-900" : "bg-white hover:bg-slate-50"}`}>{s}</button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
