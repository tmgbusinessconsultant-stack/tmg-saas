"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/content-management";

type SeoForm = {
  title: string;
  description: string;
  keywords: string;
  openGraphImage: string;
  canonicalUrl: string;
  schemaMarkup: string;
};
const defaults: SeoForm = { title: "", description: "", keywords: "", openGraphImage: "", canonicalUrl: "", schemaMarkup: "" };

export default function SeoSettingsPage() {
  const [token, setToken] = useState("");
  const [form, setForm] = useState<SeoForm>(defaults);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const accessToken = sessionStorage.getItem("accessToken");
      if (!accessToken) {
        setError("Sign in with an administrator account to edit SEO settings.");
        return;
      }
      setToken(accessToken);
      void apiRequest<Record<string, unknown> | null>("/admin/content/settings/seo", accessToken)
        .then((value) => {
          if (!value) return;
          setForm({
            title: typeof value.title === "string" ? value.title : "",
            description: typeof value.description === "string" ? value.description : "",
            keywords: Array.isArray(value.keywords) ? value.keywords.join(", ") : "",
            openGraphImage: typeof value.openGraphImage === "string" ? value.openGraphImage : "",
            canonicalUrl: typeof value.canonicalUrl === "string" ? value.canonicalUrl : "",
            schemaMarkup: value.schemaMarkup ? JSON.stringify(value.schemaMarkup, null, 2) : "",
          });
        })
        .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load SEO settings."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let schemaMarkup: unknown = null;
    try {
      if (form.schemaMarkup.trim()) schemaMarkup = JSON.parse(form.schemaMarkup) as unknown;
    } catch {
      setError("Schema markup must be valid JSON.");
      return;
    }
    try {
      await apiRequest("/admin/content/settings/seo", token, {
        method: "PUT",
        body: JSON.stringify({ value: {
          title: form.title,
          description: form.description,
          keywords: form.keywords.split(",").map((value) => value.trim()).filter(Boolean),
          openGraphImage: form.openGraphImage,
          canonicalUrl: form.canonicalUrl,
          schemaMarkup,
        } }),
      });
      setError("");
      setNotice("Site SEO settings saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save SEO settings.");
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Content Management</p><h1 className="mt-2 text-4xl font-bold">SEO Settings</h1><p className="mt-3 text-slate-600">Site-wide search and social-sharing defaults. Individual blog posts can override these fields.</p></div><Link href="/admin/content" className="rounded-md border border-slate-300 px-4 py-2 font-semibold">Content menu</Link></div>
      {(error || notice) && <p role={error ? "alert" : "status"} className={`mt-6 rounded-lg p-4 text-sm ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{error || notice}</p>}
      <form onSubmit={(event) => void save(event)} className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium">Meta title<input maxLength={180} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" /></label>
        <label className="block text-sm font-medium">Meta description<textarea maxLength={320} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" /></label>
        <label className="block text-sm font-medium">Keywords (comma-separated)<input value={form.keywords} onChange={(event) => setForm({ ...form, keywords: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" /></label>
        <label className="block text-sm font-medium">Open Graph image URL<input type="url" value={form.openGraphImage} onChange={(event) => setForm({ ...form, openGraphImage: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" /></label>
        <label className="block text-sm font-medium">Canonical URL<input type="url" value={form.canonicalUrl} onChange={(event) => setForm({ ...form, canonicalUrl: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" /></label>
        <label className="block text-sm font-medium">Schema markup JSON<textarea rows={6} value={form.schemaMarkup} onChange={(event) => setForm({ ...form, schemaMarkup: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2 font-mono text-xs" /></label>
        <button type="submit" disabled={!token} className="rounded-md bg-[#0F172A] px-5 py-3 font-semibold text-white">Save settings</button>
      </form>
    </main>
  );
}
