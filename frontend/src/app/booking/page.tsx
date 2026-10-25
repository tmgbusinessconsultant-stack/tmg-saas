import type { Metadata } from "next";
import { Suspense } from "react";
import QuoteRequestForm from "@/components/quote-request-form";

export const metadata: Metadata = {
  title: "Get Quote | TMG Business Consulting",
  description: "Tell us your business needs — strategy, AI setup, SOPs, or growth support. Get a tailored proposal within 24 hours.",
  alternates: { canonical: "https://tmgbusinessconsulting.com/booking" },
  openGraph: {
    title: "Get Quote | TMG Business Consulting",
    description: "Share your goals and get a tailored proposal from TMG.",
    url: "https://tmgbusinessconsulting.com/booking",
    type: "website",
  },
};

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-[#FCFCF9]">
      <div className="mx-auto max-w-7xl px-6 py-14 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">Get a quote</p>
            <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 leading-[1.1]">Tell us what you need</h1>
            <p className="mt-5 text-[15px] leading-7 text-zinc-500 max-w-xl">
              Share your goals, service needs, and timeline. We’ll respond with a tailored proposal and next steps within 24 hours.
            </p>

            <div className="mt-8 rounded-[24px] border border-zinc-200 bg-white p-6 md:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <h2 className="text-sm font-semibold text-zinc-900">What you can request</h2>
              <ul className="mt-4 space-y-3">
                {[
                  "Business consulting & strategy",
                  "AI tool setup & automation",
                  "Process and SOP creation",
                  "Website & digital growth support",
                  "Training & workshops",
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-[14px] text-zinc-600">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4AF37]" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-zinc-100 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-600">
                <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse" />
                Average response: 2 hours
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="rounded-[24px] border border-zinc-200 bg-white p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <Suspense fallback={<div className="h-64 animate-pulse rounded-[16px] bg-zinc-100" />}>
              <QuoteRequestForm source="booking" />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
