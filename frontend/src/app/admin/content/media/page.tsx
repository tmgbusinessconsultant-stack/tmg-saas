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
  homepage: { label: "Homepage gallery", href: "/", guidance: "Adds this image to the homepage “From our work” section. To use it in the hero banner, select it separately in Homepage Content." },
  "homepage-hero": { label: "Homepage hero", href: "/", guidance: "The hero image is configured separately in Homepage Content. Select the image there and save; publishing it to Homepage does not select it as the hero." },
  blog: { label: "Blog", href: "/blog", guidance: "Makes the image available to blog posts. Add it as a post image and publish the post for it to appear there." },
  services: { label: "Services", href: "/services", guidance: "Adds this image to the Services page “Services in action” section." },
  gallery: { label: "Public gallery", href: "/gallery", guidance: "Makes the image available to the gallery manager. Create a visible Gallery Entry before it appears in the public gallery." },
  "case-study": { label: "Case studies", href: "/case-studies", guidance: "Adds this image to the Case Studies page’s featured-media section." },
  about: { label: "About", href: "/about", guidance: "Adds this image to the About page’s media section." },
};

function formatSize(value: string): string {
  const size = Number(value);
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

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
    setBusy(true);
    setError("");
    setNotice("");
    const form = new FormData();
    form.set("file", file);
    form.set("location", folder);
    try {
      const uploaded = await apiRequest<CmsMedia>("/admin/content/media", token, { method: "POST", body: form });
      await refresh(token);
      setNotice(uploaded.status === "AVAILABLE"
        ? `${file.name} uploaded and is available for publishing.`
        : uploaded.status === "UNSCANNED"
          ? `${file.name} uploaded to local storage, but local storage does not scan files. Configure private S3 storage with malware scanning before publishing.`
          : `${file.name} uploaded. It will be available after the malware scan finishes.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Media upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleLocation(item: CmsMedia, location: string) {
    const next = item.locations.includes(location)
      ? item.locations.filter((current) => current !== location)
      : [...item.locations, location];
    try {
      await apiRequest(`/admin/content/media/${encodeURIComponent(item.id)}`, token, {
        method: "PATCH",
        body: JSON.stringify({ locations: next }),
      });
      await refresh(token);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update media publishing.");
    }
  }

  async function deleteItem(item: CmsMedia) {
    const usageDetails = item.usages.length
      ? `\n\nCurrently used in:\n${item.usages.map((usage) => `• ${usage.label}`).join("\n")}\n\nDelete anyway? Any references may stop displaying.`
      : item.locations.length
        ? `\n\nPublished to: ${item.locations.map((location) => destinationPages[location]?.label ?? location).join(", ")}.\n\nDelete anyway?`
        : "";
    if (!window.confirm(`Delete ${item.originalName}?${usageDetails}`)) return;
    try {
      await apiRequest(`/admin/content/media/${encodeURIComponent(item.id)}`, token, { method: "DELETE" });
      await refresh(token);
      setNotice(`${item.originalName} deleted.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete media.");
    }
  }

  async function replace(item: CmsMedia, file: File) {
    const form = new FormData();
    form.set("file", file);
    try {
      const replaced = await apiRequest<CmsMedia>(`/admin/content/media/${encodeURIComponent(item.id)}/file`, token, { method: "PUT", body: form });
      await refresh(token);
      setNotice(replaced.status === "AVAILABLE"
        ? `${item.originalName} was replaced and is available for publishing.`
        : replaced.status === "UNSCANNED"
          ? `${item.originalName} was replaced, but local storage does not scan files. Configure private S3 storage with malware scanning before publishing.`
          : `${item.originalName} was replaced. It will be published again after the new file passes scanning.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not replace media.");
    }
  }

  async function copyUrl(item: CmsMedia) {
    try {
      await navigator.clipboard.writeText(mediaUrl(item.url));
      setNotice("Public media URL copied.");
    } catch {
      setError("Could not copy the URL. Check clipboard permissions.");
    }
  }

  function usagePageCount(item: CmsMedia): number {
    const pages = new Set(item.usages.map((usage) => usage.href));
    if (item.locations.includes("homepage")) pages.add("/");
    if (item.locations.includes("services")) pages.add("/services");
    if (item.locations.includes("about")) pages.add("/about");
    if (item.locations.includes("case-study")) pages.add("/case-studies");
    return pages.size;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Content Management</p>
          <h1 className="mt-2 text-4xl font-bold">Media Library</h1>
          <p className="mt-3 text-slate-600">Upload images, PDF documents, or MP4 videos up to 25 MB. Only images can be published into website sections.</p>
        </div>
        <Link href="/admin/content" className="rounded-md border border-slate-300 px-4 py-2 font-semibold">Content menu</Link>
      </div>
      {(error || notice) && <p role={error ? "alert" : "status"} className={`mt-6 rounded-lg p-4 text-sm ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{error || notice}</p>}

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Step 1: Upload media</h2>
        <p className="mt-2 text-sm text-slate-600">Files are stored privately first. After upload, the security scan runs before an image can be published.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_2fr]">
          <label className="text-sm font-medium">
            Upload destination (storage folder)
            <select value={folder} onChange={(event) => setFolder(event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 p-2">
              {folders.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">
            Select file
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.svg,.webp,.gif,.pdf,.mp4"
              disabled={!token || busy}
              className="mt-1 block w-full rounded-md border border-slate-300 p-2"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void upload(file);
              }}
            />
          </label>
        </div>
        {busy && <p role="status" className="mt-3 text-sm text-blue-800">⏳ Uploading and processing file…</p>}
      </section>

      <p className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
        <strong>Workflow:</strong> Step 1 upload → Step 2 security scan → Step 3 publish an image to website sections. To show an image in the public Gallery, create a separate Gallery Entry after publishing it there.
      </p>

      <section className="mt-8">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium">
            Search files
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="mt-1 block rounded-md border border-slate-300 p-2" />
          </label>
          <label className="text-sm font-medium">
            File type
            <select value={type} onChange={(event) => setType(event.target.value)} className="mt-1 block rounded-md border border-slate-300 p-2">
              <option value="">All types</option>
              <option value="image/">Images</option>
              <option value="video/">Videos</option>
              <option value="application/">Documents</option>
            </select>
          </label>
          <button type="button" onClick={() => void refresh(token).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not refresh media."))} className="rounded-md border border-slate-300 px-4 py-2 font-semibold">Refresh</button>
        </div>
        {items.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-slate-600">No matching media files.</p>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex h-48 items-center justify-center bg-slate-100">
                  <AdminMediaPreview
                    url={item.previewUrl}
                    token={token}
                    contentType={item.contentType}
                    alt={item.originalName}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="p-5">
                  <h2 className="break-words font-semibold">{item.originalName}</h2>
                  <p className="mt-1 text-xs text-slate-500">{item.contentType} · {formatSize(item.size)} · Uploaded {new Date(item.createdAt).toLocaleString()}</p>
                  <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${item.status === "AVAILABLE" ? "bg-green-100 text-green-900" : item.status === "SCANNING" ? "bg-blue-100 text-blue-900" : "bg-red-100 text-red-900"}`} role="status">
                    {item.scanStatus === "PENDING"
                      ? "⏳ Pending scan"
                      : item.scanStatus === "NOT_SCANNED"
                        ? "⚠️ Not scanned · cannot publish"
                        : item.scanStatus === "PASSED"
                          ? item.usages.some((usage) => usage.entityType === "HOMEPAGE_HERO")
                          ? "⭐ Featured · scan passed"
                          : item.usages.some((usage) => usage.published)
                            || item.locations.some((location) => ["homepage", "services", "about", "case-study"].includes(location))
                            ? "✅ Published · scan passed"
                            : item.locations.length
                              ? "📌 Destination selected · action may be required"
                            : "✅ Scan passed · ready to publish"
                          : "❌ Scan failed · contact support"}
                  </p>
                  {item.locations.length > 0 && (
                    <p className="mt-2 text-sm text-slate-700">
                      <strong>Published destinations:</strong>{" "}
                      {item.locations.map((location) => destinationPages[location]?.label ?? location).join(", ")}
                    </p>
                  )}
                  <div className="mt-3 rounded-lg bg-slate-50 p-3">
                    <p className="text-sm font-semibold">
                      Used in {usagePageCount(item)} page{usagePageCount(item) === 1 ? "" : "s"}
                    </p>
                    {item.usages.length > 0 ? (
                      <ul className="mt-1 space-y-1 text-xs text-slate-600">
                        {item.usages.map((usage) => (
                          <li key={`${usage.entityType}:${usage.entityId}:${usage.label}`} className="flex flex-wrap gap-x-2">
                            <span>{usage.label}{usage.published ? "" : " (not public yet)"}</span>
                            <Link href={usage.href} target="_blank" className="underline">Open page</Link>
                          </li>
                        ))}
                      </ul>
                    ) : item.locations.length > 0 ? (
                      <p className="mt-1 text-xs text-slate-600">Visible in the published sections listed above.</p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-600">Not currently referenced by a page or content entry.</p>
                    )}
                  </div>
                  <fieldset disabled={item.status !== "AVAILABLE" || !item.contentType.startsWith("image/")} className="mt-4 space-y-2 disabled:opacity-50">
                    <legend className="text-sm font-semibold">Step 3: Publish to website sections</legend>
                    {item.scanStatus === "NOT_SCANNED" && <p className="text-xs text-amber-800">This file has not been malware-scanned. Configure private S3 storage with GuardDuty Malware Protection before publishing.</p>}
                    {!item.contentType.startsWith("image/") && <p className="text-xs text-amber-800">Only images can be published to page sections. PDFs and MP4s remain available in the Media Library.</p>}
                    {locations.map(([value, label]) => (
                      <label key={value} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={item.locations.includes(value)} onChange={() => void toggleLocation(item, value)} />
                        {label}
                      </label>
                    ))}
                  </fieldset>
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <label className="text-xs font-medium">
                      Destination preview
                      <select
                        value={previewLocation[item.id] ?? "homepage"}
                        onChange={(event) => setPreviewLocation((current) => ({ ...current, [item.id]: event.target.value }))}
                        disabled={!item.contentType.startsWith("image/")}
                        className="mt-1 block rounded-md border border-slate-300 bg-white p-2 text-sm"
                      >
                        {Object.entries(destinationPages).map(([value, destination]) => (
                          <option key={value} value={value}>{destination.label}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => setPreview({ item, location: previewLocation[item.id] ?? "homepage" })}
                      disabled={!item.contentType.startsWith("image/")}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50"
                    >
                      Preview destination
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                    <button type="button" onClick={() => void copyUrl(item)} disabled={item.status !== "AVAILABLE" || item.locations.length === 0} className="underline disabled:opacity-40">Copy URL</button>
                    <button type="button" onClick={() => void deleteItem(item)} className="text-red-700 underline">Delete</button>
                  </div>
                  {item.status === "AVAILABLE" && item.contentType.startsWith("image/") && item.locations.includes("gallery") && (
                    <div className={`mt-3 rounded-lg p-3 text-sm ${galleryItems.some((galleryItem) => galleryItem.mediaId === item.id) ? "bg-green-50 text-green-900" : "bg-amber-50 text-amber-950"}`}>
                      {galleryItems.some((galleryItem) => galleryItem.mediaId === item.id && galleryItem.isVisible)
                        ? "✅ Gallery entry is visible."
                        : galleryItems.some((galleryItem) => galleryItem.mediaId === item.id)
                          ? <>🟠 Gallery entry is saved but hidden. <Link href="/admin/content/gallery" className="ml-1 font-semibold underline">Enable it in Website Gallery Management</Link>.</>
                          : <>🖼 Gallery action needed: publishing only makes this image available. Create a separate Gallery Entry to show it at /gallery. <Link href={`/admin/content/gallery?mediaId=${encodeURIComponent(item.id)}`} className="ml-1 font-semibold underline">Create Gallery Entry</Link></>}
                    </div>
                  )}
                  <label className="mt-4 block text-sm font-medium">
                    Replace file
                    <input type="file" accept=".jpg,.jpeg,.png,.svg,.webp,.gif,.pdf,.mp4" className="mt-1 block w-full text-sm" onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) void replace(item, file);
                    }} />
                  </label>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreview(null);
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="destination-preview-title" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8A6A00]">Destination preview</p>
                <h2 id="destination-preview-title" className="mt-1 text-2xl font-bold">
                  {destinationPages[preview.location]?.label ?? "Website section"}
                </h2>
                <p className="mt-2 text-sm text-slate-600">{destinationPages[preview.location]?.guidance}</p>
              </div>
              <button type="button" onClick={() => setPreview(null)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">Close</button>
            </div>
            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <div className="flex min-h-56 items-center justify-center p-4">
                <AdminMediaPreview
                  url={preview.item.previewUrl}
                  token={token}
                  contentType={preview.item.contentType}
                  alt={preview.item.originalName}
                  className="max-h-80 max-w-full object-contain"
                />
              </div>
              <div className="border-t border-slate-200 bg-white p-4">
                <p className="font-semibold">{preview.item.originalName}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {preview.location === "homepage-hero"
                    ? preview.item.usages.some((usage) => usage.entityType === "HOMEPAGE_HERO")
                      ? "This image is currently selected as the homepage hero."
                      : "This image is not currently selected as the homepage hero."
                    : preview.item.status === "AVAILABLE"
                    ? preview.item.locations.includes(preview.location)
                      ? "Scan passed and this destination is enabled."
                      : "Scan passed, but this destination is not enabled yet."
                    : "This image cannot be shown publicly until its scan passes."}
                </p>
                <Link href={destinationPages[preview.location]?.href ?? "/"} target="_blank" className="mt-3 inline-block font-semibold underline">
                  Open destination page
                </Link>
              </div>
            </div>
            {preview.location === "homepage" && (
              <p className="mt-3 text-sm text-amber-900">
                This preview represents the Homepage “From our work” section. The hero banner image is configured separately in Homepage Content.
              </p>
            )}
            {preview.location === "homepage-hero" && (
              <p className="mt-3 text-sm text-amber-900">
                This is a visual preview only. Choose the image from the Homepage Content hero selector to make it live.
              </p>
            )}
            {preview.location === "gallery" && (
              <p className="mt-3 text-sm text-amber-900">
                Publishing enables this image for Gallery Entries; it will appear publicly only after you create a visible entry.
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
