"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest, type CmsGalleryItem, type CmsMedia, mediaUrl } from "@/lib/content-management";
import AdminMediaPreview from "@/components/admin-media-preview";

const folders = ["blog", "services", "clients", "gallery", "documents"];
const locations = [
  ["homepage", "Homepage"], ["blog", "Blog"], ["services", "Service page"],
  ["gallery", "Gallery"], ["case-study", "Case study"], ["about", "About us"],
];
const destinationPages: Record<string, { label: string; href: string; guidance: string }> = {
  homepage: { label: "Homepage gallery", href: "/", guidance: "Adds this image to the homepage “From our work” section." },
  "homepage-hero": { label: "Homepage hero", href: "/", guidance: "The hero image is configured separately in Homepage Content." },
  blog: { label: "Blog", href: "/blog", guidance: "Makes the image available to blog posts." },
  services: { label: "Services", href: "/services", guidance: "Adds this image to the Services page." },
  gallery: { label: "Public gallery", href: "/gallery", guidance: "Makes the image available to gallery manager." },
  "case-study": { label: "Case studies", href: "/case-studies", guidance: "Adds this image to Case Studies." },
  about: { label: "About", href: "/about", guidance: "Adds this image to About page." },
};

function formatSize(value: string): string {
  const size = Number(value);
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getUsages(item: CmsMedia) { return (item as any).usages ?? []; }
function getLocations(item: CmsMedia) { return (item as any).locations ?? []; }

export default function MediaLibraryPage() {
  const [token, setToken] = useState("");
  const [items, setItems] = useState<CmsMedia[]>([]);
  const [galleryItems, setGalleryItems] = useState<CmsGalleryItem[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [folder, setFolder] = useState("blog");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ item: CmsMedia; location: string } | null>(null);
  const [previewLocation, setPreviewLocation] = useState<Record<string, string>>({});

  const refresh = useCallback(async (accessToken: string) => {
    const query = new URLSearchParams();
    if (search.trim()) query.set("search", search.trim());
    if (type) query.set("type", type);
    const suffix = query.size ? `?${query.toString()}` : "";
    const [nextItems, nextGalleryItems] = await Promise.all([
      apiRequest<CmsMedia[]>(`/admin/content/media${suffix}`, accessToken),
      apiRequest<CmsGalleryItem[]>("/admin/content/gallery", accessToken),
    ]);
    setItems(nextItems);
    setGalleryItems(nextGalleryItems);
  }, [search, type]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const accessToken = sessionStorage.getItem("accessToken");
      if (!accessToken) {
        setError("Sign in with an administrator account to manage media.");
        return;
      }
      setToken(accessToken);
      void refresh(accessToken).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load media."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    if (!token || !items.some((item) => item.status === "SCANNING")) return;
    const timer = window.setInterval(() => {
      void Promise.all(items.filter((item) => item.status === "SCANNING").map((item) =>
        apiRequest(`/admin/content/media/${encodeURIComponent(item.id)}/scan`, token, { method: "POST" }),
      )).then(() => refresh(token)).catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "Could not refresh media scan statuses.");
      });
    }, 8000);
    return () => window.clearInterval(timer);
  }, [items, refresh, token]);

  async function upload(file: File) {
    setBusy(true); setError(""); setNotice("");
    const form = new FormData();
    form.set("file", file);
    form.set("location", folder);
    try {
      const uploaded = await apiRequest<CmsMedia>("/admin/content/media", token, { method: "POST", body: form });
      await refresh(token);
      setNotice(`${file.name} uploaded.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Media upload failed.");
    } finally { setBusy(false); }
  }

  async function toggleLocation(item: CmsMedia, location: string) {
    const locs = getLocations(item);
    const next = locs.includes(location) ? locs.filter((current: string) => current !== location) : [...locs, location];
    try {
      await apiRequest(`/admin/content/media/${encodeURIComponent(item.id)}`, token, { method: "PATCH", body: JSON.stringify({ locations: next }) });
      await refresh(token);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update."); }
  }

  async function deleteItem(item: CmsMedia) {
    const usages = getUsages(item); const locs = getLocations(item);
    const usageDetails = usages.length ? `\n\nCurrently used in:\n${usages.map((u: any) => `• ${u.label}`).join("\n")}` : locs.length ? `\n\nPublished to: ${locs.join(", ")}.` : "";
    if (!window.confirm(`Delete ${item.originalName}?${usageDetails}`)) return;
    try {
      await apiRequest(`/admin/content/media/${encodeURIComponent(item.id)}`, token, { method: "DELETE" });
      await refresh(token);
      setNotice(`${item.originalName} deleted.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete media."); }
  }

  async function replace(item: CmsMedia, file: File) {
    const form = new FormData(); form.set("file", file);
    try {
      await apiRequest<CmsMedia>(`/admin/content/media/${encodeURIComponent(item.id)}/file`, token, { method: "PUT", body: form });
      await refresh(token);
      setNotice(`${item.originalName} was replaced.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not replace media."); }
  }

  async function copyUrl(item: CmsMedia) {
    try { await navigator.clipboard.writeText(mediaUrl(item.url)); setNotice("URL copied."); }
    catch { setError("Could not copy URL."); }
  }

  function usagePageCount(item: CmsMedia): number {
    const usages = getUsages(item); const locs = getLocations(item);
    const pages = new Set(usages.map((u: any) => u.href));
    if (locs.includes("homepage")) pages.add("/");
    if (locs.includes("services")) pages.add("/services");
    if (locs.includes("about")) pages.add("/about");
    if (locs.includes("case-study")) pages.add("/case-studies");
    return pages.size;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Content Management</p>
          <h1 className="mt-2 text-4xl font-bold">Media Library</h1>
          <p className="mt-3 text-slate-600">Upload images, PDF, or MP4 up to 25 MB.</p>
        </div>
        <Link href="/admin/content" className="rounded-md border border-slate-300 px-4 py-2 font-semibold">Content menu</Link>
      </div>
      {(error || notice) && <p role={error ? "alert" : "status"} className={`mt-6 rounded-lg p-4 text-sm ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{error || notice}</p>}

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Step 1: Upload media</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_2fr]">
          <label className="text-sm font-medium">Upload destination
            <select value={folder} onChange={(event) => setFolder(event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 p-2">
              {folders.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Select file
            <input type="file" accept=".jpg,.jpeg,.png,.svg,.webp,.gif,.pdf,.mp4" disabled={!token || busy} className="mt-1 block w-full rounded-md border border-slate-300 p-2"
              onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void upload(file); }} />
          </label>
        </div>
        {busy && <p className="mt-3 text-sm text-blue-800">⏳ Uploading…</p>}
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium">Search<input value={search} onChange={(e) => setSearch(e.target.value)} className="mt-1 block rounded-md border border-slate-300 p-2" /></label>
          <label className="text-sm font-medium">File type
            <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 block rounded-md border border-slate-300 p-2">
              <option value="">All</option><option value="image/">Images</option><option value="video/">Videos</option><option value="application/">Docs</option>
            </select>
          </label>
          <button type="button" onClick={() => void refresh(token)} className="rounded-md border px-4 py-2 font-semibold">Refresh</button>
        </div>
        {items.length === 0 ? <p className="mt-5 rounded-xl border border-dashed p-8 text-slate-600">No matching media files.</p> : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const usages = getUsages(item); const locs = getLocations(item);
              return (
                <article key={item.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                  <div className="flex h-48 items-center justify-center bg-slate-100">
                    <AdminMediaPreview url={item.previewUrl} token={token} contentType={item.contentType} alt={item.originalName} className="h-full w-full object-contain" />
                  </div>
                  <div className="p-5">
                    <h2 className="break-words font-semibold">{item.originalName}</h2>
                    <p className="mt-1 text-xs text-slate-500">{item.contentType} · {formatSize(item.size)} · {new Date(item.createdAt).toLocaleString()}</p>
                    <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${item.status === "AVAILABLE" ? "bg-green-100 text-green-900" : item.status === "SCANNING" ? "bg-blue-100 text-blue-900" : "bg-red-100 text-red-900"}`}>
                      {item.scanStatus === "PENDING" ? "⏳ Pending scan" : item.scanStatus === "NOT_SCANNED" ? "⚠️ Not scanned · cannot publish" : item.scanStatus === "PASSED"
                        ? usages.some((u: any) => u.entityType === "HOMEPAGE_HERO") ? "⭐ Featured · scan passed"
                          : usages.some((u: any) => u.published) || locs.some((l: string) => ["homepage", "services", "about", "case-study"].includes(l)) ? "✅ Published · scan passed"
                            : locs.length ? "📌 Destination selected"
                              : "✅ Scan passed · ready"
                        : "❌ Scan failed"}
                    </p>
                    {locs.length > 0 && <p className="mt-2 text-sm"><strong>Published:</strong> {locs.map((l: string) => destinationPages[l]?.label ?? l).join(", ")}</p>}
                    <fieldset disabled={item.status !== "AVAILABLE" || !item.contentType.startsWith("image/")} className="mt-4 space-y-2 disabled:opacity-50">
                      <legend className="text-sm font-semibold">Publish to sections</legend>
                      {locations.map(([value, label]) => (
                        <label key={value} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={locs.includes(value)} onChange={() => void toggleLocation(item, value)} />{label}</label>
                      ))}
                    </fieldset>
                    <div className="mt-4 flex gap-3 text-sm font-semibold">
                      <button type="button" onClick={() => void copyUrl(item)} className="underline">Copy URL</button>
                      <button type="button" onClick={() => void deleteItem(item)} className="text-red-700 underline">Delete</button>
                    </div>
                    <label className="mt-4 block text-sm">Replace file<input type="file" className="mt-1 block w-full text-sm" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void replace(item, f); }} /></label>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setPreview(null); }}>
          <section role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex justify-between"><h2 className="text-2xl font-bold">{destinationPages[preview.location]?.label}</h2><button onClick={() => setPreview(null)} className="rounded-md border px-3 py-2 text-sm">Close</button></div>
            <div className="mt-5 overflow-hidden rounded-xl border bg-slate-50"><div className="flex min-h-56 items-center justify-center p-4"><AdminMediaPreview url={preview.item.previewUrl} token={token} contentType={preview.item.contentType} alt={preview.item.originalName} className="max-h-80 max-w-full object-contain" /></div></div>
          </section>
        </div>
      )}
    </main>
  );
}
