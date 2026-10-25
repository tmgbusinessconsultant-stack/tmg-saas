import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Document Center | TMG Business Consulting",
  description: "9 premium AI tools for CVs, contracts, policies, SOPs and business documents — International compliance ready.",
};

const documents = [
  { title: "CV Builder", desc: "ATS-friendly CVs tailored to role & country.", href: "/ai-tools/cv-builder", tag: "Most Used" },
  { title: "Cover Letter", desc: "Country-compliant premium cover letters.", href: "/ai-tools/cover-letter", tag: "Qatar + Global" },
  { title: "Business Plan", desc: "Structured plan with market & financials.", href: "/ai-tools/business-plan", tag: "Investor Ready" },
  { title: "Business Assistant", desc: "Guidance and next steps for decisions.", href: "/ai-tools/business-assistant", tag: "AI Assistant" },
  { title: "Document Review", desc: "Legal review with jurisdiction compliance.", href: "/ai-tools/document-review", tag: "Legal" },
  { title: "Policy Generator", desc: "HR, Leave, Safety — Qatar Labour Law, Fair Work, UK Rights.", href: "/ai-tools/policy-generator", tag: "HR" },
  { title: "SOP Builder", desc: "Operational SOPs with compliance steps.", href: "/ai-tools/sop-builder", tag: "Operations" },
  { title: "Business Contracts", desc: "Client agreements & service structures.", href: "/ai-tools/business-contracts", tag: "10 Currencies" },
  { title: "Proposal Packs", desc: "Client acquisition & growth documents.", href: "/ai-tools/proposal-packs", tag: "Growth" },
];

export default function DocumentsPage() {
  return (
    <div className="min-h-screen bg-[#FCFCF9]">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        {/* Header - TMG Standard */}
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-[#D4AF37] uppercase tracking-[0.25em] text-[11px] font-bold">Document Center</p>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-zinc-900">
            Business documents that <span className="text-[#D4AF37]">build trust</span>
          </h1>
          <p className="mt-4 text-zinc-500 leading-relaxed">
            9 tools live. International compliance — QAR, AUD, AED, SAR, GBP, USD, CAD, INR, SGD, EUR.
          </p>
          <div className="mt-6 flex justify-center gap-2 flex-wrap">
            <span className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-600">9 Tools Live</span>
            <span className="rounded-full bg-zinc-900 px-3.5 py-1.5 text-xs font-bold text-white">Premium International</span>
            <span className="rounded-full bg-[#D4AF37] px-3.5 py-1.5 text-xs font-bold text-zinc-900">AUD A$ Supported</span>
          </div>
        </div>

        {/* Grid - Premium */}
        <div className="mt-14 grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {documents.map((item) => (
            <div key={item.title} className="group rounded-[24px] border border-zinc-200 bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:border-zinc-900 transition-all duration-300 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 group-hover:text-zinc-900 transition-colors">{item.tag}</span>
              </div>
              <h2 className="mt-5 text-[18px] font-semibold tracking-tight text-zinc-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500 flex-1">{item.desc}</p>
              <Link href={item.href} className="mt-6 inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-black transition-colors self-start">
                Open tool →
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs text-zinc-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Backend synced • 10 currencies • Doha, Qatar
          </div>
        </div>
      </div>
    </div>
  );
}
