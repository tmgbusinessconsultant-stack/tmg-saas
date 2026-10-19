"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

type SearchResult = {
  title: string;
  description: string;
  category: string;
  href: string;
  keywords: string[];
};

export default function SearchCenter() {
  const searchParams = useSearchParams();
  const initialQuery = (searchParams.get("q") ?? "").slice(0, 120);
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery.trim());
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const recentSearchesRef = useRef<string[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved: unknown = JSON.parse(window.localStorage.getItem("tmg-recent-searches") ?? "[]");
        if (Array.isArray(saved)) {
          const items = saved.filter((item): item is string => typeof item === "string").slice(0, 5);
          recentSearchesRef.current = items;
          setRecentSearches(items);
        }
      } catch {
        window.localStorage.removeItem("tmg-recent-searches");
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
      if (!apiUrl) return;
      void fetch(`${apiUrl}/ai/search-suggestions`)
        .then(async (response) => {
          if (!response.ok) throw new Error(`Search suggestions unavailable (${response.status}).`);
          return response.json() as Promise<{ suggestions: string[] }>;
        })
        .then((body) => setPopularSearches(body.suggestions.slice(0, 5)))
        .catch((cause: unknown) => console.error("Could not load popular search suggestions.", cause));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (submittedQuery.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      void fetch(`/api/search?q=${encodeURIComponent(submittedQuery)}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error(`Search failed (${response.status}).`);
          return response.json() as Promise<{ results: SearchResult[] }>;
        })
        .then((body) => {
          setResults(body.results);
          const history = [submittedQuery, ...recentSearchesRef.current.filter((item) => item.toLowerCase() !== submittedQuery.toLowerCase())].slice(0, 5);
          recentSearchesRef.current = history;
          setRecentSearches(history);
          window.localStorage.setItem("tmg-recent-searches", JSON.stringify(history));
          const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
          if (apiUrl) {
            void fetch(`${apiUrl}/ai/search-analytics`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ query: submittedQuery, resultCount: body.results.length }),
            }).catch((cause: unknown) => console.error("Could not record search analytics.", cause));
          }
        })
        .catch((cause: unknown) => {
          if (cause instanceof DOMException && cause.name === "AbortError") return;
          setError(cause instanceof Error ? cause.message : "Search is temporarily unavailable.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 120);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [submittedQuery]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query.trim().slice(0, 120));
    setError("");
    setResults([]);
    window.history.replaceState(null, "", query.trim() ? `/search?q=${encodeURIComponent(query.trim().slice(0, 120))}` : "/search");
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">TMG Search Center</p>
        <h1 className="mt-3 text-4xl font-bold">Find services and business insights</h1>
        <p className="mt-4 text-slate-600">Search our services, training and published articles, or ask TMG AI for general guidance.</p>
      </header>
      <form onSubmit={submit} className="mt-8 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="site-search" className="sr-only">Search TMG content</label>
        <input id="site-search" type="search" minLength={2} maxLength={120} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “Power BI”, “automation”, or “business growth”" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3" />
        <button type="submit" className="rounded-lg bg-[#0F172A] px-6 py-3 font-semibold text-white">Search</button>
      </form>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/ai" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">Ask TMG AI</Link>
        <Link href="/upload" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">Upload a project file</Link>
        <Link href="/quote" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">Request a quote</Link>
      </div>
      {(popularSearches.length > 0 || recentSearches.length > 0) && (
        <section className="mt-6 space-y-3" aria-label="Search suggestions">
          {popularSearches.length > 0 && <div><h2 className="text-sm font-semibold text-slate-600">Popular searches</h2><div className="mt-2 flex flex-wrap gap-2">{popularSearches.map((suggestion) => <button type="button" key={suggestion} onClick={() => { setQuery(suggestion); setSubmittedQuery(suggestion); }} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200">{suggestion}</button>)}</div></div>}
          {recentSearches.length > 0 && <div><h2 className="text-sm font-semibold text-slate-600">Your recent searches</h2><div className="mt-2 flex flex-wrap gap-2">{recentSearches.map((suggestion) => <button type="button" key={suggestion} onClick={() => { setQuery(suggestion); setSubmittedQuery(suggestion); }} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50">{suggestion}</button>)}</div></div>}
        </section>
      )}
      {loading && <p className="mt-8 text-slate-600" role="status">Searching published content…</p>}
      {error && <p className="mt-8 rounded-lg bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
      {!loading && !error && submittedQuery.length >= 2 && (
        <section aria-live="polite" className="mt-8">
          <h2 className="text-xl font-bold">{results.length} result{results.length === 1 ? "" : "s"} for “{submittedQuery}”</h2>
          {results.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-slate-600">No matching published content. Try a broader search or ask TMG AI.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {results.map((result) => (
                <li key={`${result.href}:${result.title}`} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8A6A00]">{result.category}</p>
                  <h3 className="mt-2 text-xl font-bold"><Link href={result.href} className="hover:underline">{result.title}</Link></h3>
                  <p className="mt-2 text-slate-600">{result.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.keywords.map((keyword) => <span key={keyword} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{keyword}</span>)}
                  </div>
                  <Link href={result.href} className="mt-4 inline-block text-sm font-semibold underline">View details</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {submittedQuery.length < 2 && <p className="mt-8 text-sm text-slate-500">Enter at least two characters to search.</p>}
    </main>
  );
}
