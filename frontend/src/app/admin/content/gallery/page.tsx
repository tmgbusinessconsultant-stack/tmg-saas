"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest, type CmsGalleryItem, type CmsMedia } from "@/lib/content-management";
import AdminMediaPreview from "@/components/admin-media-preview";

type GalleryForm = { mediaId: string; title: string; description: string; category: string; displayOrder: string; isVisible: boolean };
const blank: GalleryForm = { mediaId: "", title: "", description: "", category: "", displayOrder: "0", isVisible: true };

export default function GalleryManagementPage() {
  const [token, setToken] = useState("");
  const [items, setItems] = useState<CmsGalleryItem[]>([]);
  const [media, setMedia] = useState<CmsMedia[]>([]);
  const [form, setForm] = useState<GalleryForm>(blank);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async (accessToken: string) => {
    const [nextItems, nextMedia] = await Promise.all([
      apiRequest<CmsGalleryItem[]>("/admin/content/gallery", accessToken),
      apiRequest<CmsMedia[]>("/admin/content/media?type=image/", accessToken),
    ]);
    setItems(nextItems);
    setMedia(nextMedia);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const accessToken = sessionStorage.getItem("accessToken");
      if (!accessToken) {
        setError("Sign in with an administrator account to manage the gallery.");
        return;
      }
      setToken(accessToken);
      void refresh(accessToken)
        .then(() => {
          const mediaId = new URLSearchParams(window.location.search).get("mediaId");
          if (mediaId) setForm((current) => ({ ...current, mediaId }));
        })
        .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load gallery."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await apiRequest(editingId ? `/admin/content/gallery/${encodeURIComponent(editingId)}` : "/admin/content/gallery", token, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify({ ...form, displayOrder: Number(form.displayOrder) }),
      });
      setForm(blank);
      setEditingId("");
      await refresh(token);
      setNotice("Gallery item saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save gallery item.");
    }
  }

  async function remove(item: CmsGalleryItem) {
    if (!window.confirm(`Remove “${item.title}” from the gallery?`)) return;
    try {
      await apiRequest(`/admin/content/gallery/${encodeURIComponent(item.id)}`, token, { method: "DELETE" });
      await refresh(token);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove gallery item.");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Content Management</p><h1 className="mt-2 text-4xl font-bold">Website Gallery</h1><p className="mt-3 text-slate-600">Public images are shown at /gallery and /portfolio after a clean scan.</p><p className="mt-2 max-w-2xl rounded-lg bg-blue-50 p-3 text-sm text-blue-950">Publishing to Gallery in the Media Library only makes an image available here. Save a Gallery Entry below before it appears on the public site.</p></div>
        <Link href="/admin/content" className="rounded-md border border-slate-300 px-4 py-2 font-semibold">Content menu</Link>
      </div>
      {(error || notice) && <p role={error ? "alert" : "status"} className={`mt-6 rounded-lg p-4 text-sm ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{error || notice}</p>}
      <form onSubmit={(event) => void save(event)} className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-2">
        <h2 className="text-xl font-bold md:col-span-2">{editingId ? "Edit gallery item" : "Add gallery image"}</h2>
        <label className="text-sm font-medium md:col-span-2">Scanned image published to Gallery
          <select required value={form.mediaId} onChange={(event) => setForm({ ...form, mediaId: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2">
            <option value="">Select image</option>
            {media.filter((asset) => asset.status === "AVAILABLE" && asset.locations.includes("gallery")).map((asset) => <option key={asset.id} value={asset.id}>{asset.originalName}</option>)}
          </select>
          <Link href="/admin/content/media" className="mt-1 inline-block text-xs underline">Upload or publish images in Media Library</Link>
        </label>
        <label className="text-sm font-medium">Title<input required maxLength={180} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" /></label>
        <label className="text-sm font-medium">Category<input required maxLength={80} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" /></label>
        <label className="text-sm font-medium md:col-span-2">Description<textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" /></label>
        <label className="text-sm font-medium">Display order<input type="number" min="0" step="1" value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" /></label>
        <label className="flex items-center gap-2 self-end text-sm font-medium"><input type="checkbox" checked={form.isVisible} onChange={(event) => setForm({ ...form, isVisible: event.target.checked })} />Visible on public gallery</label>
        <div className="flex gap-3 md:col-span-2"><button type="submit" disabled={!token} className="rounded-md bg-[#0F172A] px-5 py-3 font-semibold text-white">Save item</button>{editingId && <button type="button" onClick={() => { setEditingId(""); setForm(blank); }} className="rounded-md border border-slate-300 px-5 py-3 font-semibold">Cancel</button>}</div>
      </form>
      <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const asset = media.find((entry) => entry.id === item.mediaId);
          return <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {asset && asset.contentType.startsWith("image/") && <AdminMediaPreview url={asset.previewUrl} token={token} contentType={asset.contentType} alt={item.title} className="h-48 w-full object-cover" />}
            <div className="p-4"><h2 className="font-bold">{item.title}</h2><p className="text-sm text-slate-500">{item.category} · order {item.displayOrder} · {item.isVisible ? "Visible" : "Hidden"}</p><p className="mt-2 text-sm">{item.description}</p>
              <div className="mt-3 flex gap-4 text-sm font-semibold"><button type="button" onClick={() => { setEditingId(item.id); setForm({ mediaId: item.mediaId, title: item.title, description: item.description, category: item.category, displayOrder: String(item.displayOrder), isVisible: item.isVisible }); }} className="underline">Edit</button><button type="button" onClick={() => void remove(item)} className="text-red-700 underline">Delete</button></div>
            </div>
          </article>;
        })}
        {items.length === 0 && <p className="rounded-xl border border-dashed p-6 text-slate-600">No gallery items yet.</p>}
      </section>
    </main>
  );
}
