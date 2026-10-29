"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest, type CmsCategory, type CmsMedia, type CmsPost } from "@/lib/content-management";
import { articles } from "@/app/blog/blog-content";

const RichTextEditor = dynamic(() => import("./rich-text-editor"), {
  ssr: false,
  loading: () => <div className="min-h-72 rounded-lg border border-slate-300 p-4">Loading editor…</div>,
});

type PostForm = {
  title: string; slug: string; excerpt: string; content: string;
  featuredImage: string; galleryImages: string; author: string;
  categoryId: string; tags: string; status: CmsPost["status"];
  publishDate: string; seoTitle: string; seoDescription: string;
  seoKeywords: string; openGraphImage: string; canonicalUrl: string; schemaMarkup: string;
};

const emptyForm: PostForm = {
  title: "", slug: "", excerpt: "", content: "<p></p>", featuredImage: "", galleryImages: "",
  author: "TMG Business Consulting", categoryId: "", tags: "", status: "DRAFT", publishDate: "",
  seoTitle: "", seoDescription: "", seoKeywords: "", openGraphImage: "", canonicalUrl: "", schemaMarkup: "",
};

function toForm(post: CmsPost): PostForm {
  return {
    title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content,
    featuredImage: post.featuredImage ?? "", galleryImages: post.galleryImages.join(", "),
    author: post.author, categoryId: post.categoryId, tags: post.tags.join(", "),
    status: post.status, publishDate: post.publishDate ? new Date(post.publishDate).toISOString().slice(0, 16) : "",
    seoTitle: post.seoTitle ?? "", seoDescription: post.seoDescription ?? "",
    seoKeywords: post.seoKeywords.join(", "), openGraphImage: post.openGraphImage ?? "",
    canonicalUrl: post.canonicalUrl ?? "", schemaMarkup: post.schemaMarkup ? JSON.stringify(post.schemaMarkup, null, 2) : "",
  };
}

const csv = (v: string) => [...new Set(v.split(",").map(i => i.trim()).filter(Boolean))];
const slugify = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const escapeHtml = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function articleHtml(article: (typeof articles)[number]): string {
  const sections = article.sections.map(s => {
    const ps = s.paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join("");
    const bullets = s.bullets?.length ? `<ul>${s.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join("")}</ul>` : "";
    return `<h2>${escapeHtml(s.heading)}</h2>${ps}${bullets}`;
  }).join("");
  const takeaways = `<h2>Key takeaways</h2><ul>${article.takeaways.map(i => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
  return `${sections}${takeaways}`;
}

export default function BlogManagementPage() {
  const [token, setToken] = useState("");
  const [posts, setPosts] = useState<CmsPost[]>([]);
  const [categories, setCategories] = useState<CmsCategory[]>([]);
  const [media, setMedia] = useState<CmsMedia[]>([]);
  const [form, setForm] = useState<PostForm>(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [editorKey, setEditorKey] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);

  const refresh = useCallback(async (accessToken: string) => {
    const [nextPosts, nextCategories, nextMedia] = await Promise.all([
      apiRequest<CmsPost[]>("/admin/content/blog", accessToken),
      apiRequest<CmsCategory[]>("/admin/content/categories", accessToken),
      apiRequest<CmsMedia[]>("/admin/content/media?type=image/", accessToken),
    ]);
    setPosts(nextPosts); setCategories(nextCategories); setMedia(nextMedia);
    if (!form.categoryId && nextCategories[0]) setForm(f => ({ ...f, categoryId: nextCategories[0].id }));
  }, [form.categoryId]);

  useEffect(() => {
    const accessToken = sessionStorage.getItem("accessToken") || localStorage.getItem("token") || "";
    if (!accessToken) { setError("Sign in with admin account. Go to /admin login first."); return; }
    setToken(accessToken);
    void refresh(accessToken).catch((e: any) => setError(e?.message || "Could not load blog content."));
  }, [refresh]);

  function editPost(post: CmsPost) {
    setEditingId(post.id); setForm(toForm(post)); setEditorKey(k => k + 1); setError(""); setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function newPost() {
    setEditingId(""); setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" }); setEditorKey(k => k + 1); setError(""); setNotice("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    let schemaMarkup: unknown = null;
    if (form.schemaMarkup.trim()) {
      try { schemaMarkup = JSON.parse(form.schemaMarkup); } catch { setBusy(false); setError("Schema markup must be valid JSON."); return; }
    }
    const body = { ...form, galleryImages: csv(form.galleryImages), tags: csv(form.tags), seoKeywords: csv(form.seoKeywords), schemaMarkup, publishDate: form.publishDate ? new Date(form.publishDate).toISOString() : null };
    try {
      await apiRequest(editingId ? `/admin/content/blog/${encodeURIComponent(editingId)}` : "/admin/content/blog", token, { method: editingId ? "PUT" : "POST", body: JSON.stringify(body) });
      await refresh(token); setNotice(editingId ? "Article updated." : "Article created."); newPost();
    } catch (cause: any) { setError(cause?.message || "Could not save."); } finally { setBusy(false); }
  }

  async function removePost(post: CmsPost) {
    if (!confirm(`Delete "${post.title}"?`)) return;
    try { await apiRequest(`/admin/content/blog/${encodeURIComponent(post.id)}`, token, { method: "DELETE" }); await refresh(token); if (editingId === post.id) newPost(); setNotice("Article deleted."); }
    catch (cause: any) { setError(cause?.message || "Could not delete."); }
  }

  async function importFallbackArticles() {
    const pending = articles.filter(a => !posts.some(p => p.slug === a.slug));
    if (!pending.length) { setNotice("All fallback articles already imported."); return; }
    if (!confirm(`Import ${pending.length} fallback articles as PUBLISHED?`)) return;
    setImporting(true); setError(""); setNotice("");
    try {
      const map = new Map(categories.map(c => [c.name, c.id]));
      for (const article of pending) {
        let categoryId = map.get(article.category);
        if (!categoryId) {
          const cat = await apiRequest<CmsCategory>("/admin/content/categories", token, { method: "POST", body: JSON.stringify({ name: article.category }) });
          categoryId = cat.id; map.set(cat.name, cat.id);
        }
        await apiRequest("/admin/content/blog", token, {
          method: "POST",
          body: JSON.stringify({
            title: article.title, slug: article.slug, excerpt: article.summary, content: articleHtml(article),
            featuredImage: `https://tmgbusinessconsulting.com${article.image}`, author: "TMG Business Consulting",
            categoryId, tags: [article.category], status: "PUBLISHED",
            publishDate: new Date(`${article.date}T09:00:00+03:00`).toISOString(),
            seoTitle: article.title, seoDescription: article.description, seoKeywords: [article.category, "TMG"], openGraphImage: `https://tmgbusinessconsulting.com${article.image}`,
          }),
        });
      }
      await refresh(token); setNotice(`Imported ${pending.length} articles.`);
    } catch (cause: any) { setError(cause?.message || "Import failed."); }
    finally { setImporting(false); }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Content Management</p><h1 className="mt-2 text-4xl font-bold">Blog Posts</h1></div>
        <div className="flex gap-3"><Link href="/admin/content" className="rounded-md border px-4 py-2 font-semibold">Content menu</Link><Link href="/admin/content/categories" className="rounded-md border px-4 py-2 font-semibold">Categories</Link></div>
      </div>
      {(error || notice) && <p className={`mt-6 rounded-lg p-4 text-sm ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{error || notice}</p>}
      <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={save} className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="text-xl font-bold">{editingId ? "Edit article" : "Create article"}</h2>{editingId && <button type="button" onClick={newPost} className="text-sm underline">New article</button>}</div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium">Title<input required maxLength={180} value={form.title} onChange={e => setForm({ ...form, title: e.target.value, slug: editingId ? form.slug : slugify(e.target.value) })} className="mt-1 block w-full rounded-md border p-2" /></label>
            <label className="text-sm font-medium">Slug<input required maxLength={180} value={form.slug} onChange={e => setForm({ ...form, slug: slugify(e.target.value) })} className="mt-1 block w-full rounded-md border p-2" /></label>
          </div>
          <label className="block text-sm font-medium">Excerpt<textarea required maxLength={1000} rows={3} value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} className="mt-1 block w-full rounded-md border p-2" /></label>
          <label className="block text-sm font-medium">Article content<RichTextEditor key={`${editingId}-${editorKey}`} value={form.content} onChange={content => setForm(f => ({ ...f, content }))} /></label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium">Featured image URL<input value={form.featuredImage} onChange={e => setForm({ ...form, featuredImage: e.target.value })} className="mt-1 block w-full rounded-md border p-2" />
              <select value="" onChange={e => setForm({ ...form, featuredImage: e.target.value })} className="mt-2 block w-full rounded-md border p-2"><option value="">Choose media…</option>{media.filter(m => m.status === "AVAILABLE").map(item => <option key={item.id} value={`${process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "")}${item.url}`}>{item.originalName}</option>)}</select>
            </label>
            <label className="text-sm font-medium">Gallery URLs<textarea value={form.galleryImages} onChange={e => setForm({ ...form, galleryImages: e.target.value })} rows={3} className="mt-1 block w-full rounded-md border p-2" /></label>
            <label className="text-sm font-medium">Author<input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} className="mt-1 block w-full rounded-md border p-2" /></label>
            <label className="text-sm font-medium">Category<select required value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="mt-1 block w-full rounded-md border p-2"><option value="">Select category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="text-sm font-medium">Tags<input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="mt-1 block w-full rounded-md border p-2" /></label>
            <label className="text-sm font-medium">Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="mt-1 block w-full rounded-md border p-2"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="SCHEDULED">Scheduled</option></select></label>
          </div>
          <button type="submit" disabled={busy} className="rounded-md bg-[#0F172A] px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : editingId ? "Save article" : "Create article"}</button>
        </form>
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Articles</h2><button disabled={!token || importing} onClick={() => void importFallbackArticles()} className="rounded-md border px-3 py-2 text-sm font-semibold disabled:opacity-50">{importing ? "Importing…" : "Import fallback"}</button></div>
          <ul className="mt-4 space-y-3">{posts.map(post => (<li key={post.id} className="rounded-lg border p-3"><p className="font-semibold">{post.title}</p><p className="mt-1 text-xs text-slate-500">{post.status} • {post.category?.name || post.categoryId}</p><div className="mt-2 flex gap-4 text-sm font-semibold"><button onClick={() => editPost(post)} className="underline">Edit</button><button onClick={() => void removePost(post)} className="text-red-700 underline">Delete</button></div></li>))}{posts.length === 0 && <li className="text-sm text-slate-500">No CMS articles yet.</li>}</ul>
        </section>
      </section>
    </main>
  );
}