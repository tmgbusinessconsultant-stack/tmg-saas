"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest, type CmsCategory, type CmsMedia, type CmsPost } from "@/lib/content-management";
import { articles } from "@/app/blog/blog-content";

const RichTextEditor = dynamic(() => import("./rich-text-editor"), {
  ssr: false,
  loading: () => <div className="min-h-72 rounded-lg border border-slate-300 p-4" role="status">Loading editor…</div>,
});

type PostForm = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  galleryImages: string;
  author: string;
  categoryId: string;
  tags: string;
  status: CmsPost["status"];
  publishDate: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  openGraphImage: string;
  canonicalUrl: string;
  schemaMarkup: string;
};

const emptyForm: PostForm = {
  title: "", slug: "", excerpt: "", content: "<p></p>", featuredImage: "", galleryImages: "",
  author: "", categoryId: "", tags: "", status: "DRAFT", publishDate: "",
  seoTitle: "", seoDescription: "", seoKeywords: "", openGraphImage: "", canonicalUrl: "", schemaMarkup: "",
};

function toForm(post: CmsPost): PostForm {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    featuredImage: post.featuredImage ?? "",
    galleryImages: post.galleryImages.join(", "),
    author: post.author,
    categoryId: post.categoryId,
    tags: post.tags.join(", "),
    status: post.status,
    publishDate: post.publishDate ? new Date(post.publishDate).toISOString().slice(0, 16) : "",
    seoTitle: post.seoTitle ?? "",
    seoDescription: post.seoDescription ?? "",
    seoKeywords: post.seoKeywords.join(", "),
    openGraphImage: post.openGraphImage ?? "",
    canonicalUrl: post.canonicalUrl ?? "",
    schemaMarkup: post.schemaMarkup ? JSON.stringify(post.schemaMarkup, null, 2) : "",
  };
}

function csv(value: string): string[] {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function articleHtml(article: (typeof articles)[number]): string {
  const sections = article.sections.map((section) => {
    const paragraphs = section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
    const bullets = section.bullets?.length
      ? `<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>`
      : "";
    return `<h2>${escapeHtml(section.heading)}</h2>${paragraphs}${bullets}`;
  }).join("");
  const takeaways = `<h2>Key takeaways</h2><ul>${article.takeaways.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
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
    setPosts(nextPosts);
    setCategories(nextCategories);
    setMedia(nextMedia);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const accessToken = sessionStorage.getItem("accessToken");
      if (!accessToken) {
        setError("Sign in with an administrator account to manage blog posts.");
        return;
      }
      setToken(accessToken);
      void refresh(accessToken).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load blog content."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  function editPost(post: CmsPost) {
    setEditingId(post.id);
    setForm(toForm(post));
    setEditorKey((current) => current + 1);
    setError("");
    setNotice("");
  }

  function newPost() {
    setEditingId("");
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" });
    setEditorKey((current) => current + 1);
    setError("");
    setNotice("");
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    let schemaMarkup: unknown = null;
    if (form.schemaMarkup.trim()) {
      try {
        schemaMarkup = JSON.parse(form.schemaMarkup) as unknown;
      } catch {
        setBusy(false);
        setError("Schema markup must be valid JSON.");
        return;
      }
    }
    const body = {
      ...form,
      galleryImages: csv(form.galleryImages),
      tags: csv(form.tags),
      seoKeywords: csv(form.seoKeywords),
      schemaMarkup,
      publishDate: form.publishDate ? new Date(form.publishDate).toISOString() : null,
    };
    try {
      await apiRequest(editingId ? `/admin/content/blog/${encodeURIComponent(editingId)}` : "/admin/content/blog", token, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      await refresh(token);
      setNotice(editingId ? "Article updated." : "Article created.");
      setEditingId("");
      setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" });
      setEditorKey((current) => current + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the article.");
    } finally {
      setBusy(false);
    }
  }

  async function removePost(post: CmsPost) {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    try {
      await apiRequest(`/admin/content/blog/${encodeURIComponent(post.id)}`, token, { method: "DELETE" });
      await refresh(token);
      if (editingId === post.id) newPost();
      setNotice("Article deleted.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete the article.");
    }
  }

  async function importFallbackArticles() {
    const pending = articles.filter((article) => !posts.some((post) => post.slug === article.slug));
    if (pending.length === 0) {
      setNotice("All fallback articles are already in the CMS.");
      return;
    }
    if (!window.confirm(`Import ${pending.length} existing fallback article(s) into the CMS as published posts?`)) return;
    setImporting(true);
    setError("");
    setNotice("");
    try {
      const categoryByName = new Map(categories.map((category) => [category.name, category.id]));
      for (const article of pending) {
        let categoryId = categoryByName.get(article.category);
        if (!categoryId) {
          const category = await apiRequest<CmsCategory>("/admin/content/categories", token, {
            method: "POST",
            body: JSON.stringify({ name: article.category }),
          });
          categoryId = category.id;
          categoryByName.set(category.name, category.id);
        }
        await apiRequest("/admin/content/blog", token, {
          method: "POST",
          body: JSON.stringify({
            title: article.title,
            slug: article.slug,
            excerpt: article.summary,
            content: articleHtml(article),
            featuredImage: `https://tmgbusinessconsulting.com${article.image}`,
            author: "TMG Business Consulting",
            categoryId,
            tags: [article.category],
            status: "PUBLISHED",
            publishDate: new Date(`${article.date}T09:00:00+03:00`).toISOString(),
            seoTitle: article.title,
            seoDescription: article.description,
            seoKeywords: [article.category, "TMG Business Consulting"],
            openGraphImage: `https://tmgbusinessconsulting.com${article.image}`,
          }),
        });
      }
      await refresh(token);
      setNotice(`Imported ${pending.length} article(s). Their hardcoded versions remain as fallback until each CMS post is available.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not import fallback articles.");
      await refresh(token);
    } finally {
      setImporting(false);
    }
  }

  function changeTitle(value: string) {
    setForm((current) => ({
      ...current,
      title: value,
      ...(editingId ? {} : { slug: slugify(value) }),
    }));
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Content Management</p>
          <h1 className="mt-2 text-4xl font-bold">Blog Posts</h1>
          <p className="mt-3 text-slate-600">Draft, schedule, publish, and optimize articles for the public blog.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/content" className="rounded-md border border-slate-300 px-4 py-2 font-semibold">Content menu</Link>
          <Link href="/admin/content/categories" className="rounded-md border border-slate-300 px-4 py-2 font-semibold">Categories</Link>
        </div>
      </div>
      {(error || notice) && <p role={error ? "alert" : "status"} className={`mt-6 rounded-lg p-4 text-sm ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{error || notice}</p>}
      <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={(event) => void save(event)} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{editingId ? "Edit article" : "Create article"}</h2>
            {editingId && <button type="button" onClick={newPost} className="text-sm font-semibold underline">New article</button>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium">Title
              <input required maxLength={180} value={form.title} onChange={(event) => changeTitle(event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 p-2" />
            </label>
            <label className="text-sm font-medium">Slug
              <input required maxLength={180} value={form.slug} onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" />
            </label>
          </div>
          <label className="block text-sm font-medium">Excerpt
            <textarea required maxLength={1000} rows={3} value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" />
          </label>
          <label className="block text-sm font-medium">Article content
            <RichTextEditor key={`${editingId}-${editorKey}`} value={form.content} onChange={(content) => setForm((current) => ({ ...current, content }))} />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium">Featured image URL
              <input value={form.featuredImage} onChange={(event) => setForm({ ...form, featuredImage: event.target.value })} placeholder="Paste a published Media Library URL" className="mt-1 block w-full rounded-md border border-slate-300 p-2" />
              <select value="" onChange={(event) => setForm({ ...form, featuredImage: event.target.value })} className="mt-2 block w-full rounded-md border border-slate-300 p-2">
                <option value="">Choose a scanned blog image…</option>
                {media.filter((item) => item.status === "AVAILABLE" && item.locations.includes("blog")).map((item) => <option key={item.id} value={`${process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "")}${item.url}`}>{item.originalName}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">Gallery image URLs
              <textarea value={form.galleryImages} onChange={(event) => setForm({ ...form, galleryImages: event.target.value })} placeholder="Comma-separated published image URLs" rows={3} className="mt-1 block w-full rounded-md border border-slate-300 p-2" />
            </label>
            <label className="text-sm font-medium">Author
              <input value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" />
            </label>
            <label className="text-sm font-medium">Category
              <select required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2">
                <option value="">Select a category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">Tags (comma-separated)
              <input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" />
            </label>
            <label className="text-sm font-medium">Publication status
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as CmsPost["status"] })} className="mt-1 block w-full rounded-md border border-slate-300 p-2">
                <option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="SCHEDULED">Scheduled</option>
              </select>
            </label>
            <label className="text-sm font-medium">Publish date
              <input type="datetime-local" value={form.publishDate} onChange={(event) => setForm({ ...form, publishDate: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" />
            </label>
          </div>
          <details className="rounded-lg border border-slate-200 p-4">
            <summary className="cursor-pointer font-semibold">SEO and structured data</summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium">SEO title<input maxLength={180} value={form.seoTitle} onChange={(event) => setForm({ ...form, seoTitle: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" /></label>
              <label className="text-sm font-medium">Meta description<textarea maxLength={320} rows={2} value={form.seoDescription} onChange={(event) => setForm({ ...form, seoDescription: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" /></label>
              <label className="text-sm font-medium">Keywords (comma-separated)<input value={form.seoKeywords} onChange={(event) => setForm({ ...form, seoKeywords: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" /></label>
              <label className="text-sm font-medium">Open Graph image URL<input value={form.openGraphImage} onChange={(event) => setForm({ ...form, openGraphImage: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" /></label>
              <label className="text-sm font-medium">Canonical URL<input type="url" value={form.canonicalUrl} onChange={(event) => setForm({ ...form, canonicalUrl: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" /></label>
              <label className="text-sm font-medium">Schema markup JSON<textarea rows={4} value={form.schemaMarkup} onChange={(event) => setForm({ ...form, schemaMarkup: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2 font-mono text-xs" /></label>
            </div>
          </details>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy || categories.length === 0} className="rounded-md bg-[#0F172A] px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : editingId ? "Save article" : "Create article"}</button>
            <Link href="/admin/content/media" className="rounded-md border border-slate-300 px-5 py-3 font-semibold">Open Media Library</Link>
          </div>
          {categories.length === 0 && <p className="text-sm text-amber-800">Create a category before adding articles.</p>}
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Articles</h2>
            <button type="button" disabled={!token || importing} onClick={() => void importFallbackArticles()} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50">{importing ? "Importing…" : "Import current fallback articles"}</button>
          </div>
          <ul className="mt-4 space-y-3">
            {posts.map((post) => (
              <li key={post.id} className="rounded-lg border border-slate-200 p-3">
                <p className="font-semibold">{post.title}</p>
                <p className="mt-1 text-xs text-slate-500">{post.status} · {post.category.name}</p>
                <div className="mt-2 flex gap-4 text-sm font-semibold">
                  <button type="button" onClick={() => editPost(post)} className="underline">Edit</button>
                  <button type="button" onClick={() => void removePost(post)} className="text-red-700 underline">Delete</button>
                </div>
              </li>
            ))}
            {posts.length === 0 && <li className="text-sm text-slate-500">No CMS articles yet. Current public fallback posts are unchanged.</li>}
          </ul>
        </section>
      </section>
    </main>
  );
}




