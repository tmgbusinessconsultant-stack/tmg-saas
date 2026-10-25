import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import QuoteRequestForm from "@/components/quote-request-form";

export const metadata: Metadata = {
  title: "Request a Quote | TMG Business Consulting",
  description: "Tell TMG Business Consulting about your project and request a tailored proposal within 24 hours.",
  alternates: { canonical: "https://tmgbusinessconsulting.com/quote" },
  openGraph: {
    title: "Request a Quote | TMG Business Consulting",
    description: "Get a tailored proposal for strategy, AI setup, SOPs, and growth support.",
    url: "https://tmgbusinessconsulting.com/quote",
    type: "website",
  },
};

export default function QuotePage() {
  return (
    <div className="mx-auto px-6 py-16" style={{ maxWidth: "var(--container-max)" }}>
      <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">
        <div>
          <p className="uppercase tracking-[0.2em] text-xs font-semibold" style={{ color: "var(--gold)" }}>Request a quote</p>
          <h1 className="mt-3 font-bold tracking-tight" style={{ fontSize: "var(--h1-size)", fontFamily: "var(--font-family)", lineHeight: "1.1" }}>
            Get your tailored proposal
          </h1>
          <p className="mt-4 leading-7 text-slate-600" style={{ fontSize: "var(--font-size)", lineHeight: "var(--line-height)" }}>
            Share your goals and timeline. Our team will review and send a clear proposal with scope, timeline, and next steps.
          </p>

          <div className="mt-8 p-6 border" style={{ borderRadius: "var(--radius)", background: "var(--card-bg)", borderColor: "var(--border-color)", borderWidth: "var(--border-width)" }}>
            <h2 className="font-bold" style={{ fontSize: "var(--h3-size)" }}>Popular requests</h2>
            <ul className="mt-4 space-y-3 text-slate-700">
              <li className="flex gap-2"><span style={{ color: "var(--gold)" }}>•</span> Business strategy & growth plan</li>
              <li className="flex gap-2"><span style={{ color: "var(--gold)" }}>•</span> AI automation & tools setup</li>
              <li className="flex gap-2"><span style={{ color: "var(--gold)" }}>•</span> SOPs, proposals, business docs</li>
              <li className="flex gap-2"><span style={{ color: "var(--gold)" }}>•</span> Website & digital marketing</li>
            </ul>
            <div className="mt-6 text-sm text-slate-500">Trusted by 120+ businesses in Qatar & beyond</div>
          </div>

          <p className="mt-6 text-sm text-slate-500">Prefer to talk? <Link href="/contact" className="font-semibold underline" style={{ color: "var(--primary)" }}>Contact us</Link></p>
        </div>

        <div className="border shadow-sm p-6 md:p-8" style={{ borderRadius: "var(--radius)", background: "var(--card-bg)", borderColor: "var(--border-color)", borderWidth: "var(--border-width)" }}>
          <Suspense fallback={<div className="h-64 animate-pulse bg-slate-100 rounded-xl" />}>
            <QuoteRequestForm source="quote" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
