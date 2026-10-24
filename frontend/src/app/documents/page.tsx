import Link from "next/link";
const documents = [
  { title: "CV Builder", description: "Create a professional, ATS-friendly CV for your target role. 10 countries, A$, QAR, £, $, etc", href: "/ai-tools/cv-builder", linkLabel: "Open tool →", flag: "🇶🇦🇦🇺🇬🇧🇺🇸", active: true },
  { title: "Cover Letter", description: "Premium International Cover Letter with country-specific compliance. QAR, AUD, GBP, USD", href: "/ai-tools/cover-letter", linkLabel: "Open tool →", flag: "🇶🇦🇦🇺", active: true },
  { title: "Business Plan", description: "Generate a structured business plan for your idea and market. QAR, AUD A$, USD, GBP, EUR — 10 countries", href: "/ai-tools/business-plan", linkLabel: "Open tool →", flag: "🇶🇦🇦🇺🇺🇸", active: true },
  { title: "Business Assistant", description: "Get business guidance and practical next steps. International — A$, QAR, £, $ with local law", href: "/ai-tools/business-assistant", linkLabel: "Open assistant →", flag: "🤖🌍", active: true },
  { title: "Document Review / Judgement Review", description: "Legal Document Review with jurisdiction compliance. A$, QAR, £, $, financial impact in local currency", href: "/ai-tools/document-review", linkLabel: "Open tool →", flag: "⚖️🇦🇺🇶🇦", active: true },
  { title: "Policy Generator", description: "HR, Leave, Safety Policies with local law compliance. Qatar Labour Law, Fair Work Act 2009, UK Employment Rights", href: "/ai-tools/policy-generator", linkLabel: "Open tool →", flag: "📋🇶🇦🇦🇺🇬🇧", active: true },
  { title: "SOP Builder", description: "Standard Operating Procedures for operations. International compliance ready", href: "/ai-tools/sop-builder", linkLabel: "Open tool →", flag: "⚙️🌍", active: true },
  { title: "Business Contracts", description: "Professional structures for client agreements and service arrangements. A$, QAR, AED, SAR, £, $, C$, ₹, € — 10 countries", href: "/ai-tools/business-contracts", linkLabel: "Open tool →", flag: "📄🌍", active: true },
  { title: "Proposal Packs", description: "Presentation-ready documents for business growth and client acquisition. Investment in local currency — QAR, AUD A$, AED, etc", href: "/ai-tools/proposal-packs", linkLabel: "Open tool →", flag: "📊🌍", active: true },
];
export default function DocumentsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center max-w-3xl mx-auto">
        <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs font-semibold">Document Center — Premium International — All 9 Tools Live ✅</p>
        <h1 className="mt-3 text-4xl font-bold">Business documents that build trust — Global Ready</h1>
        <p className="mt-3 text-sm text-slate-600">Qatar QAR, Australia AUD A$, UAE AED, Saudi SAR, UK GBP £, USA USD $, Canada CAD C$, India INR ₹, Singapore SGD, EU EUR € — All with local law compliance — 10 Countries | 9 Payable Services</p>
        <div className="mt-4 flex justify-center gap-2 flex-wrap"><span className="bg-black text-white text-xs px-3 py-1 rounded-full">9 Tools Live</span><span className="bg-[#D4AF37] text-black text-xs px-3 py-1 rounded-full font-bold">AUD A$ Supported</span><span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full">Premium International</span></div>
      </div>
      <div className="mt-12 grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {documents.map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow hover:scale-[1.02]">
            <div className="flex justify-between"><div className="text-[#D4AF37] font-bold text-xs uppercase">TMG • {item.flag}</div><div className="text-xs bg-black text-white px-2 py-0.5 rounded-full">Premium • {item.active ? 'Live' : 'Soon'}</div></div>
            <h2 className="mt-4 text-xl font-bold">{item.title}</h2>
            <p className="mt-3 text-slate-600 text-sm">{item.description}</p>
            <Link href={item.href} className="mt-4 inline-block text-sm font-semibold text-[#0F172A] hover:text-[#8A6A00] bg-amber-50 px-3 py-1 rounded-full border">
              {item.linkLabel}
            </Link>
          </div>
        ))}
      </div>
      <div className="mt-12 text-center text-xs text-gray-500">Backend: cv-documents.service.ts supports CV, Cover Letter, Judgement Review, Policy, SOP, Contract, Proposal — All with currency: QAR, AUD A$, AED, SAR, GBP £, USD $, CAD C$, INR ₹, SGD S$, EUR € | TMG Premium International</div>
    </div>
  );
}
