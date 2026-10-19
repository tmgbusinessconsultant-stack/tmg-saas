import Link from "next/link";

const documents = [
  { title: "CV Builder", description: "Create a professional, ATS-friendly CV for your target role.", href: "/ai-tools/cv-builder", linkLabel: "Open tool" },
  { title: "Business Plan", description: "Generate a structured business plan for your idea and market.", href: "/ai-tools/business-plan", linkLabel: "Open tool" },
  { title: "Business Assistant", description: "Get business guidance and practical next steps.", href: "/ai-tools/business-assistant", linkLabel: "Open assistant" },
  { title: "SOP Templates", description: "Explore standard operating procedures for more repeatable operations.", href: null, linkLabel: "" },
  { title: "Policy Library", description: "Human resources, operations, and governance policy frameworks.", href: null, linkLabel: "" },
  { title: "Business Contracts", description: "Professional structures for client agreements and service arrangements.", href: null, linkLabel: "" },
  { title: "Proposal Packs", description: "Presentation-ready documents for business growth and client acquisition.", href: null, linkLabel: "" },
];

export default function DocumentsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center max-w-3xl mx-auto">
        <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs font-semibold">Document Center</p>
        <h1 className="mt-3 text-4xl font-bold">Business documents that build trust</h1>
      </div>

      <div className="mt-12 grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {documents.map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-[#D4AF37] font-bold text-sm uppercase">TMG</div>
            <h2 className="mt-4 text-xl font-bold">{item.title}</h2>
            <p className="mt-3 text-slate-600">{item.description}</p>
            {item.href ? (
              <Link href={item.href} className="mt-4 inline-block text-sm font-semibold text-[#0F172A] hover:text-[#8A6A00]">
                {item.linkLabel} →
              </Link>
            ) : (
              <span className="mt-4 inline-block text-sm text-slate-500">Coming soon</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
