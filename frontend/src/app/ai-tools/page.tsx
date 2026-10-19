import Link from "next/link";

const tools = [
  { name: "Business Plan Generator", description: "Create structured, investor-ready business plans tailored to your market and business model.", href: "/ai-tools/business-plan" },
  { name: "CV Builder", description: "Create an ATS-friendly CV tailored to your target role and experience.", href: "/ai-tools/cv-builder" },
  { name: "Business Assistant", description: "Get conversational support for business setup, strategy, and practical next steps.", href: "/ai-tools/business-assistant" },
  { name: "Risk Assessment Generator", description: "Evaluate operational, market, and strategic risks before committing resources.", href: null },
  { name: "SOP Generator", description: "Generate workflows, policies, and operational processes for teams and departments.", href: null },
  { name: "Productivity Planner Generator", description: "Create a practical daily and weekly plan for teams seeking greater focus and consistency.", href: null },
  { name: "Proposal Generator", description: "Build polished proposals and client-facing documents that communicate value clearly.", href: null },
];

export default function AIToolsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="text-center max-w-3xl mx-auto">
        <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs font-semibold">AI tools</p>
        <h1 className="mt-3 text-4xl font-bold">Turn ideas into action with AI-powered business support</h1>
      </div>

      <div className="mt-12 grid md:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <div key={tool.name} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-[#D4AF37] font-semibold uppercase tracking-wide text-xs">TMG Tool</div>
            <h2 className="mt-4 text-2xl font-bold">{tool.name}</h2>
            <p className="mt-4 text-slate-600 leading-7">{tool.description}</p>
            {tool.href ? (
              <Link href={tool.href} className="mt-6 inline-block bg-[#0F172A] text-white px-6 py-3 rounded-md font-semibold">Use tool</Link>
            ) : (
              <span className="mt-6 inline-block text-sm font-semibold text-slate-500">Coming soon</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
