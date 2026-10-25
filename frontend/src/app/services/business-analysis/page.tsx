import Link from "next/link";
import type { Metadata } from "next";

const PAGE_URL = "https://tmgbusinessconsulting.com/services/business-analysis";
const TITLE = "Business Analysis Services | TMG";
const DESC = "Assess operations, performance, risks, and opportunities with practical business analysis from TMG in Qatar and worldwide.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: PAGE_URL },
  openGraph: { title: TITLE, description: DESC, url: PAGE_URL, type: "website", siteName: "TMG Business Consulting" },
  twitter: { card: "summary", title: TITLE, description: DESC },
};

const questions = [
  { question: "What does business analysis include?", answer: "Scope is agreed for each engagement and may include reviewing processes, performance information, risks, and opportunities, then providing practical recommendations." },
  { question: "Who is business analysis for?", answer: "TMG works with founders, small and medium-sized businesses, and teams seeking clearer evidence for operational or growth decisions." },
  { question: "How much does it cost and how long does it take?", answer: "Cost and delivery time depend on scope and available information. TMG reviews the request and confirms a tailored proposal; there is no automatic fixed estimate." },
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Business Analysis",
  serviceType: "Business consulting and analysis",
  description: DESC,
  provider: { "@type": "Organization", name: "TMG Business Consulting", url: "https://tmgbusinessconsulting.com" },
  areaServed: [{ "@type": "Country", name: "Qatar" }, { "@type": "Place", name: "Worldwide" }],
  url: PAGE_URL,
  offers: { "@type": "Offer", availability: "https://schema.org/InStock", priceCurrency: "USD", price: "0", description: "Request a quote" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: questions.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
};

export default function BusinessAnalysisPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <main className="mx-auto px-6 py-16" style={{ maxWidth: "var(--container-max)" }}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--gold)" }}>TMG Consulting</p>
        <h1 className="mt-3 font-bold tracking-tight" style={{ fontSize: "var(--h1-size)", fontFamily: "var(--font-family)", lineHeight: "1.1" }}>
          Business analysis services
        </h1>
        <p className="mt-5 max-w-3xl leading-8 text-slate-600" style={{ fontSize: "var(--font-size)", lineHeight: "var(--line-height)" }}>
          Build a clearer view of business performance, operations, and opportunities. TMG helps translate available evidence into practical recommendations and an agreed next-step plan.
        </p>

        <section className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            "Review processes and performance measures",
            "Identify operational risks and improvement opportunities",
            "Prioritize recommendations against business goals"
          ].map((item) => (
            <div key={item} className="border bg-white p-5 font-semibold shadow-sm" style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)", background: "var(--card-bg)" }}>
              {item}
            </div>
          ))}
        </section>

        <section className="mt-12 space-y-4 max-w-3xl">
          <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-family)" }}>Frequently asked questions</h2>
          {questions.map((item) => (
            <details key={item.question} className="group border bg-white p-5 open:shadow-sm" style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)" }}>
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                {item.question}
                <span className="ml-4 text-slate-400 group-open:rotate-180 transition-transform">⌄</span>
              </summary>
              <p className="mt-3 leading-7 text-slate-600">{item.answer}</p>
            </details>
          ))}
        </section>

        <Link href="/quote" className="mt-8 inline-flex items-center justify-center font-semibold text-black transition hover:opacity-90" style={{ borderRadius: "var(--button-radius)", minHeight: "var(--button-height)", background: "var(--gold)", paddingLeft: "20px", paddingRight: "20px" }}>
          Request a tailored proposal
        </Link>
      </main>
    </>
  );
}
