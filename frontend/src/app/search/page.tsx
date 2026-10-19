import type { Metadata } from "next";
import { Suspense } from "react";
import SearchCenter from "./search-center";

export const metadata: Metadata = {
  title: "Search TMG Services and Business Insights",
  description: "Search TMG Business Consulting services, training, and published business insights.",
  alternates: { canonical: "/search" },
  openGraph: {
    title: "Search TMG Services and Business Insights",
    description: "Find business consulting, training, and published insights from TMG.",
    url: "/search",
    type: "website",
  },
  twitter: { card: "summary", title: "Search TMG Services and Business Insights" },
};

export default function SearchPage() {
  const searchActionSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TMG Business Consulting",
    url: "https://tmgbusinessconsulting.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://tmgbusinessconsulting.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(searchActionSchema) }} />
      <Suspense fallback={<main className="mx-auto max-w-5xl px-6 py-14" aria-busy="true">Loading search…</main>}>
        <SearchCenter />
      </Suspense>
    </>
  );
}
