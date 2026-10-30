import type { Metadata } from "next";
import { Suspense } from "react";
import SearchCenter from "./search-center";

export const metadata: Metadata = {
  title: "Search | TMG Business Consulting",
  description: "Search TMG Business Consulting services, training, and published business insights.",
  alternates: { canonical: "https://tmgbusinessconsulting.com/search" },
  robots: {
    index: false, // search result pages = noindex
    follow: true, // but follow links inside
    noarchive: true,
  },
  openGraph: {
    title: "Search TMG Services and Business Insights",
    description: "Find business consulting, training, and published insights from TMG.",
    url: "https://tmgbusinessconsulting.com/search",
    type: "website",
    siteName: "TMG Business Consulting",
  },
  twitter: {
    card: "summary",
    title: "Search | TMG Business Consulting",
    description: "Find services, training, and insights from TMG."
  },
};

export default function SearchPage() {
  const searchActionSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TMG Business Consulting",
    url: "https://tmgbusinessconsulting.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://tmgbusinessconsulting.com/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(searchActionSchema) }}
      />
      <Suspense
        fallback={
          <main className="mx-auto px-6 py-14" style={{ maxWidth: "var(--container-max)" }} aria-busy="true">
            <div className="animate-pulse space-y-4">
              <div className="h-10 w-full max-w-md bg-slate-200 rounded-xl" />
              <div className="h-6 w-3/4 bg-slate-100 rounded" />
            </div>
          </main>
        }
      >
        <SearchCenter />
      </Suspense>
    </>
  );
}

