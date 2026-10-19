import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Analysis Services",
  description: "Assess operations, performance, risks, and opportunities with practical business analysis from TMG.",
  alternates: { canonical: "/services/business-analysis" },
  openGraph: { title: "Business Analysis Services", url: "/services/business-analysis", type: "website" },
  twitter: { card: "summary", title: "Business Analysis Services" },
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
  description: metadata.description,
  provider: { "@type": "Organization", name: "TMG Business Consulting", url: "https://tmgbusinessconsulting.com" },
  areaServed: ["Qatar", "Worldwide"],
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
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">TMG Consulting</p>
        <h1 className="mt-3 text-4xl font-bold">Business analysis services</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Build a clearer view of business performance, operations, and opportunities. TMG helps translate available evidence into practical recommendations and an agreed next-step plan.</p>
        <section className="mt-8 grid gap-5 sm:grid-cols-3">
          {["Review processes and performance measures", "Identify operational risks and improvement opportunities", "Prioritize recommendations against business goals"].map((item) => <div key={item} className="rounded-xl border bg-white p-5 font-semibold">{item}</div>)}
        </section>
        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-bold">Frequently asked questions</h2>
          {questions.map((item) => <details key={item.question} className="rounded-lg border bg-white p-5"><summary className="cursor-pointer font-semibold">{item.question}</summary><p className="mt-3 leading-7 text-slate-600">{item.answer}</p></details>)}
        </section>
        <Link href="/quote" className="mt-8 inline-flex rounded-md bg-[#D4AF37] px-5 py-3 font-semibold text-black">Request a tailored proposal</Link>
      </main>
    </>
  );
}
