import Link from "next/link";
import PublishedMediaSection from "@/components/published-media-section";

const services = [
  {
    name: "Business Analysis",
    description: "Assess operations, performance measures, risks, and opportunities to prioritize practical business improvements.",
    benefits: ["Process and performance review", "Evidence-led opportunity mapping", "Prioritized recommendations"],
    price: "Request a quote",
    href: "/services/business-analysis",
  },
  {
    name: "AI Consulting",
    description: "Strategy, automation, and AI workflows for businesses looking to improve efficiency and decision making.",
    benefits: ["AI opportunity mapping", "Process automation advice", "Clear implementation roadmap"],
    price: "Request a quote",
    href: "/quote",
  },
  {
    name: "Company Formation",
    description: "Guidance for planning your company formation and understanding the steps involved in Qatar and the wider region.",
    benefits: ["Setup pathway guidance", "Document and process overview", "Practical next steps"],
    price: "Request a quote",
    href: "/quote",
  },
  {
    name: "PRO and Document Clearing",
    description: "Support navigating administrative requirements and document processing for your business.",
    benefits: ["Requirements guidance", "Document preparation support", "Process coordination"],
    price: "Request a quote",
    href: "/quote",
  },
  {
    name: "Productivity Training",
    description: "Team workshops and coaching focused on systems, efficiency, and better working habits.",
    benefits: ["Team productivity workshops", "Documentation systems", "Workflow optimization"],
    price: "Request a quote",
    href: "/training",
  },
  {
    name: "Business Consulting",
    description: "Practical support for growth planning, positioning, and organizational clarity across operations and strategy.",
    benefits: ["Business model refinement", "Market positioning", "Execution support"],
    price: "Request a quote",
    href: "/quote",
  },
  {
    name: "Website Consulting",
    description: "Website strategy and conversion improvements to help businesses present a stronger digital experience.",
    benefits: ["Website audit", "Messaging strategy", "Lead generation improvements"],
    price: "Request a quote",
    href: "/quote",
  },
];

export default function ServicesPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center max-w-3xl mx-auto">
        <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs font-semibold">Services</p>
        <h1 className="mt-3 text-4xl font-bold">Business services in Qatar and beyond</h1>
        <p className="mt-4 text-slate-600">Company formation guidance, PRO and document clearing support, AI automation, consulting, and training. Service scope and pricing are confirmed for each request.</p>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        {services.map((service) => (
          <div key={service.name} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="min-w-0 text-2xl font-bold">{service.name}</h2>
              <span className="bg-[#FFF9E5] text-[#8A6A00] px-3 py-1 rounded-full text-sm font-semibold">{service.price}</span>
            </div>
            <p className="mt-4 text-slate-600 leading-7">{service.description}</p>
            <ul className="mt-6 space-y-3 text-slate-700">
              {service.benefits.map((benefit) => (
                <li key={benefit} className="flex gap-2"><span className="text-[#D4AF37] font-bold">✓</span> {benefit}</li>
              ))}
            </ul>
            <Link href={service.href} className="mt-8 inline-block bg-[#0F172A] text-white px-6 py-3 rounded-md font-semibold">{service.href === "/quote" ? "Request a quote" : "Learn more"}</Link>
          </div>
        ))}
      </div>
      <PublishedMediaSection location="services" title="Services in action" />
    </div>
  );
}
