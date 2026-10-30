"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest, type CmsCategory } from "@/lib/content-management";

export default function BlogCategoriesPage() {
  const [token, setToken] = useState("");
  const [categories, setCategories] = useState<CmsCategory[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async (accessToken: string) => {
    setCategories(await apiRequest<CmsCategory[]>("/admin/content/categories", accessToken));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const accessToken = sessionStorage.getItem("accessToken");
      if (!accessToken) {
        setError("Sign in with an administrator account to manage categories.");
        return;
      }
      setToken(accessToken);
      void refresh(accessToken).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load categories."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await apiRequest("/admin/content/categories", token, { method: "POST", body: JSON.stringify({ name }) });
      setName("");
      await refresh(token);
      setNotice("Category created.");
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create category.");
    }
  }

  async function remove(category: CmsCategory) {
    if (!window.confirm(`Delete category “${category.name}”? Categories used by blog posts cannot be deleted.`)) return;
    try {
      await apiRequest(`/admin/content/categories/${encodeURIComponent(category.id)}`, token, { method: "DELETE" });
      await refresh(token);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete category.");
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Content Management</p><h1 className="mt-2 text-4xl font-bold">Blog Categories</h1></div>
        <Link href="/admin/content" className="rounded-md border border-slate-300 px-4 py-2 font-semibold">Content menu</Link>
      </div>
      {(error || notice) && <p role={error ? "alert" : "status"} className={`mt-6 rounded-lg p-4 text-sm ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{error || notice}</p>}
      <form onSubmit={(event) => void create(event)} className="mt-8 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-5">
        <label className="min-w-[220px] flex-1 text-sm font-medium">Category name
          <input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 p-2" />
        </label>
        <button type="submit" disabled={!token} className="self-end rounded-md bg-[#0F172A] px-5 py-2.5 font-semibold text-white">Add category</button>
      </form>
      <ul className="mt-5 divide-y rounded-xl border border-slate-200 bg-white">
        {categories.map((category) => <li key={category.id} className="flex items-center justify-between gap-4 p-4"><div><p className="font-semibold">{category.name}</p><p className="text-sm text-slate-500">/{category.slug}</p></div><button type="button" onClick={() => void remove(category)} className="font-semibold text-red-700 underline">Delete</button></li>)}
        {categories.length === 0 && <li className="p-5 text-slate-500">No categories yet.</li>}
      </ul>
    </main>
  );
}





