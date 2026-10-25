import Link from "next/link";
import type { Metadata } from "next";
import PublishedMediaSection from "@/components/published-media-section";

export const metadata: Metadata = {
  title: "Business Services in Qatar | TMG Business Consulting",
  description: "Company formation guidance, PRO services, AI consulting, business analysis, training and website consulting in Qatar and beyond.",
  alternates: { canonical: "https://tmgbusinessconsulting.com/services" },
  openGraph: {
    title: "Business Services in Qatar | TMG",
    description: "Company formation, PRO, AI consulting, and training services.",
    url: "https://tmgbusinessconsulting.com/services",
    type: "website",
    siteName: "TMG Business Consulting",
  },
};

const services = [
  {
    name: "Business Analysis",
    description: "Assess operations, performance measures, risks, and opportunities to prioritize practical business improvements.",
    benefits: ["Process and performance review", "Evidence-led opportunity mapping", "Prioritized recommendations"],
    href: "/services/business-analysis",
  },
  {
    name: "AI Consulting",
    description: "Strategy, automation, and AI workflows for businesses looking to improve efficiency and decision making.",
    benefits: ["AI opportunity mapping", "Process automation advice", "Clear implementation roadmap"],
    href: "/services/ai-consulting",
  },
  {
    name: "Company Formation",
    description: "Guidance for planning your company formation and understanding the steps involved in Qatar and the wider region.",
    benefits: ["Setup pathway guidance", "Document and process overview", "Practical next steps"],
    href: "/services/company-formation",
  },
  {
    name: "PRO and Document Clearing",
    description: "Support navigating administrative requirements and document processing for your business.",
    benefits: ["Requirements guidance", "Document preparation support", "Process coordination"],
    href: "/services/pro-services",
  },
  {
    name: "Productivity Training",
    description: "Team workshops and coaching focused on systems, efficiency, and better working habits.",
    benefits: ["Team productivity workshops", "Documentation systems", "Workflow optimization"],
    href: "/training",
  },
  {
    name: "Business Consulting",
    description: "Practical support for growth planning, positioning, and organizational clarity.",
    benefits: ["Business model refinement", "Market positioning", "Execution support"],
    href: "/services/business-consulting",
  },
  {
    name: "Website Consulting",
    description: "Website strategy and conversion improvements to help businesses present a stronger digital experience.",
    benefits: ["Website audit", "Messaging strategy", "Lead generation improvements"],
    href: "/services/website-consulting",
  },
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "TMG Business Consulting Services",
  itemListElement: services.map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Service",
      name: s.name,
      description: s.description,
      provider: { "@type": "Organization", name: "TMG Business Consulting", url: "https://tmgbusinessconsulting.com" },
      areaServed: { "@type": "Country", name: "Qatar" },
      url: `https://tmgbusinessconsulting.com${s.href}`,
    },
  })),
};

export default function ServicesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <div className="mx-auto px-6 py-16" style={{ maxWidth: "var(--container-max)" }}>
        <div className="text-center max-w-3xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-xs font-semibold" style={{ color: "var(--gold)" }}>Services</p>
          <h1 className="mt-3 font-bold tracking-tight" style={{ fontSize: "var(--h1-size)", fontFamily: "var(--font-family)", lineHeight: "1.1" }}>
            Business services in Qatar and beyond
          </h1>
          <p className="mt-4 leading-7 text-slate-600" style={{ lineHeight: "var(--line-height)" }}>
            Company formation guidance, PRO and document clearing support, AI automation, consulting, and training. Service scope and pricing are confirmed for each request.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {services.map((service) => (
            <div key={service.name} className="min-w-0 border bg-white p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col" style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)", background: "var(--card-bg)" }}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="min-w-0 text-2xl font-bold" style={{ fontFamily: "var(--font-family)" }}>{service.name}</h2>
                <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--gold-light, #FFF9E5)", color: "var(--gold)" }}>Request a quote</span>
              </div>
              <p className="mt-4 text-slate-600 leading-7 flex-1">{service.description}</p>
              <ul className="mt-6 space-y-3 text-slate-700">
                {service.benefits.map((benefit) => (
                  <li key={benefit} className="flex gap-2"><span style={{ color: "var(--gold)" }} className="font-bold">✓</span> {benefit}</li>
                ))}
              </ul>
              <Link
                href={service.href}
                className="mt-8 inline-flex items-center justify-center font-semibold text-white transition hover:opacity-90 w-fit"
                style={{ borderRadius: "var(--button-radius)", minHeight: "var(--button-height)", background: "var(--primary)", paddingLeft: "24px", paddingRight: "24px" }}
              >
                {service.href === "/quote" ? "Request a quote" : "Learn more"}
              </Link>
            </div>
          ))}
        </div>

        <PublishedMediaSection location="services" title="Services in action" />
      </div>
    </>
  );
}