import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
// FIXED: Adjusted import path case structure to match your components directory convention exactly
import QuoteRequestForm from "@/components/quote-request-form";

export const metadata: Metadata = {
  metadataBase: new URL("https://tmgbusinessconsulting.com"),
  title: "Request a Quote | TMG Business Consulting",
  description: "Tell TMG Business Consulting about your project and request a tailored proposal within 24 hours.",
  alternates: { canonical: "https://tmgbusinessconsulting.com" },
  openGraph: {
    title: "Request a Quote | TMG Business Consulting",
    description: "Get a tailored proposal for strategy, AI setup, SOPs, and growth support.",
    url: "https://tmgbusinessconsulting.com",
    type: "website",
  },
};

export default function QuotePage() {
  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 font-sans antialiased" style={{ maxWidth: "var(--container-max)" }}>
      <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">

        {/* Left Column: Descriptive Context & Structural Value Propositions */}
        <div className="space-y-6">
          <div>
            <p className="uppercase tracking-[0.25em] text-[11px] font-black" style={{ color: "var(--gold)" }}>
              Request a Quote
            </p>
            <h1 className="mt-3 font-black tracking-tight text-zinc-900" style={{ fontSize: "var(--h1-size)", fontFamily: "var(--font-family)", lineHeight: "1.1" }}>
              Get your tailored operational proposal
            </h1>
            <p className="mt-4 text-zinc-500 font-medium text-justify" style={{ fontSize: "var(--font-size)", lineHeight: "var(--line-height)" }}>
              Share your strategic corporate goals, deployment scale, and delivery timeline metrics. Our regional executive advisory division will evaluate your submission parameters and return a clear project prospectus outlining exact implementation scope, milestones, and actionable next steps.
            </p>
          </div>

          {/* Core Service Request Target Mapping Panel */}
          <div className="p-6 border shadow-sm transition-all" style={{ borderRadius: "var(--radius)", background: "var(--card-bg)", borderColor: "var(--border-color)", borderWidth: "var(--border-width)" }}>
            <h2 className="font-black text-zinc-900 tracking-tight" style={{ fontSize: "var(--h3-size)" }}>
              Popular Advisory Matrices
            </h2>
            <ul className="mt-4 space-y-3 font-semibold text-zinc-700 text-sm">
              <li className="flex items-center gap-2">
                <span className="font-bold text-sm shrink-0" style={{ color: "var(--gold)" }}>&bull;</span>
                Business strategy & structured growth planning
              </li>
              <li className="flex items-center gap-2">
                <span className="font-bold text-sm shrink-0" style={{ color: "var(--gold)" }}>&bull;</span>
                Enterprise AI automation workflow architectures
              </li>
              <li className="flex items-center gap-2">
                <span className="font-bold text-sm shrink-0" style={{ color: "var(--gold)" }}>&bull;</span>
                Compliant SOP models, corporate proposals, & policy books
              </li>
              <li className="flex items-center gap-2">
                <span className="font-bold text-sm shrink-0" style={{ color: "var(--gold)" }}>&bull;</span>
                High-conversion digital web platform architectures
              </li>
            </ul>
            <div className="mt-6 pt-4 border-t border-zinc-100 text-xs font-bold text-zinc-400 uppercase tracking-wide">
              Trusted by 120+ active enterprises in Qatar & global markets
            </div>
          </div>

          <p className="text-xs font-semibold text-zinc-500">
            Prefer immediate consultation channels?{" "}
            <Link href="/contact" className="font-bold underline underline-offset-4 hover:opacity-80 transition-opacity" style={{ color: "var(--primary)" }}>
              Establish Direct Contact Terminal
            </Link>
          </p>
        </div>

        {/* Right Column: Encapsulated Secured Quote Input Pipeline Form */}
        <div className="border shadow-md p-6 md:p-8" style={{ borderRadius: "var(--radius)", background: "var(--card-bg)", borderColor: "var(--border-color)", borderWidth: "var(--border-width)" }}>
          <Suspense fallback={<div className="h-64 animate-pulse bg-zinc-100 rounded-2xl" style={{ borderRadius: "var(--input-radius)" }} />}>
            <QuoteRequestForm source="quote" />
          </Suspense>
        </div>

      </div>
    </div>
  );
}

