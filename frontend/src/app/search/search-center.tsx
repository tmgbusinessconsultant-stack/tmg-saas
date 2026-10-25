"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

type SearchResult = {
  title: string;
  description: string;
  category: string;
  href: string;
  keywords: string[];
};

export default function SearchCenter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = (searchParams.get("q") ?? "").slice(0, 120);

  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery.trim());
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const recentRef = useRef<string[]>([]);

  // Load recent + popular
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("tmg-recent-searches") ?? "[]");
      if (Array.isArray(saved)) {
        const clean = saved.filter((i: unknown): i is string => typeof i === "string").slice(0, 5);
        recentRef.current = clean;
        setRecentSearches(clean);
      }
    } catch { localStorage.removeItem("tmg-recent-searches"); }

    // Popular from same API — no NEXT_PUBLIC_API_URL exposure
    fetch("/api/search-suggestions", { cache: "no-store" })
      .then(r => r.ok ? r.json() : { suggestions: [] })
      .then((b: { suggestions: string[] }) => setPopularSearches(b.suggestions.slice(0, 5)))
      .catch(() => { });
  }, []);

  // Search effect
  useEffect(() => {
    if (submittedQuery.length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(submittedQuery)}`, { signal: ctrl.signal, cache: "no-store" });
        if (!res.ok) throw new Error("Search unavailable.");
        const body = (await res.json()) as { results: SearchResult[] };
        setResults(body.results);
        // Save recent
        const history = [submittedQuery, ...recentRef.current.filter(i => i.toLowerCase() !== submittedQuery.toLowerCase())].slice(0, 5);
        recentRef.current = history;
        setRecentSearches(history);
        localStorage.setItem("tmg-recent-searches", JSON.stringify(history));
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Search failed.");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 300); // 300ms debounce — better than 120ms
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [submittedQuery]);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim().slice(0, 120);
    setSubmittedQuery(trimmed);
    setError("");
    router.replace(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search", { scroll: false });
  }

  function pickSuggestion(s: string) {
    setQuery(s);
    setSubmittedQuery(s);
    router.replace(`/search?q=${encodeURIComponent(s)}`, { scroll: false });
  }

  return (
    <main className="mx-auto px-6 py-14" style={{ maxWidth: "var(--container-max)" }}>
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--gold)" }}>TMG Search Center</p>
        <h1 className="mt-3 font-bold tracking-tight" style={{ fontSize: "var(--h1-size)", fontFamily: "var(--font-family)" }}>Find services and business insights</h1>
        <p className="mt-4 text-slate-600" style={{ lineHeight: "var(--line-height)" }}>Search our services, training and published articles, or ask TMG AI for guidance.</p>
      </header>

      <form onSubmit={submit} className="mx-auto mt-8 flex max-w-3xl flex-col gap-3 sm:flex-row">
        <label htmlFor="site-search" className="sr-only">Search TMG content</label>
        <input
          id="site-search"
          type="search"
          minLength={2}
          maxLength={120}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try “Power BI”, “automation”, or “business growth”"
          className="min-w-0 flex-1 border bg-white px-4 py-3 shadow-sm outline-none focus:ring-2"
          style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)", borderWidth: "var(--border-width)" }}
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center px-6 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ borderRadius: "var(--button-radius)", minHeight: "var(--button-height)", background: "var(--primary)" }}
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      <div className="mx-auto mt-4 flex max-w-3xl flex-wrap gap-2">
        <Link href="/ai" className="border px-4 py-2 text-sm font-semibold hover:bg-slate-50" style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)" }}>Ask TMG AI</Link>
        <Link href="/upload" className="border px-4 py-2 text-sm font-semibold hover:bg-slate-50" style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)" }}>Upload file</Link>
        <Link href="/quote" className="border px-4 py-2 text-sm font-semibold hover:bg-slate-50" style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)" }}>Request quote</Link>
      </div>

      {(popularSearches.length > 0 || recentSearches.length > 0) && (
        <section className="mx-auto mt-6 max-w-3xl space-y-4" aria-label="Suggestions">
          {popularSearches.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-600">Popular searches</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {popularSearches.map(s => <button key={s} type="button" onClick={() => pickSuggestion(s)} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200 transition">{s}</button>)}
              </div>
            </div>
          )}
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-600">Your recent searches</h2>
                <button onClick={() => { localStorage.removeItem("tmg-recent-searches"); setRecentSearches([]); recentRef.current = []; }} className="text-xs underline text-slate-500">Clear</button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {recentSearches.map(s => <button key={s} type="button" onClick={() => pickSuggestion(s)} className="rounded-full border px-3 py-1.5 text-sm hover:bg-slate-50" style={{ borderColor: "var(--border-color)" }}>{s}</button>)}
              </div>
            </div>
          )}
        </section>
      )}

      {loading && <p className="mx-auto mt-8 max-w-3xl text-slate-600" role="status">Searching published content…</p>}
      {error && <p className="mx-auto mt-8 max-w-3xl rounded-lg bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}

      {!loading && !error && submittedQuery.length >= 2 && (
        <section aria-live="polite" className="mx-auto mt-8 max-w-3xl">
          <h2 className="text-xl font-bold">{results.length} result{results.length === 1 ? "" : "s"} for <span className="text-slate-500 font-normal break-all">{submittedQuery}</span></h2>
          {results.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed p-6 text-center" style={{ borderColor: "var(--border-color)", background: "var(--card-bg)" }}>
              <p className="text-slate-600">No matching content. Try broader term or</p>
              <Link href="/ai" className="mt-3 inline-block font-semibold underline" style={{ color: "var(--primary)" }}>Ask TMG AI</Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {results.map((r) => (
                <li key={`${r.href}:${r.title}`} className="border bg-white p-5 shadow-sm transition hover:shadow-md" style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--gold)" }}>{r.category}</p>
                  <h3 className="mt-2 text-xl font-bold"><Link href={r.href} className="hover:underline">{r.title}</Link></h3>
                  <p className="mt-2 text-slate-600 line-clamp-2">{r.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">{r.keywords.slice(0, 4).map(k => <span key={k} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{k}</span>)}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {submittedQuery.length < 2 && <p className="mx-auto mt-8 max-w-3xl text-sm text-slate-500">Enter at least 2 characters to search.</p>}
    </main>
  );
}
