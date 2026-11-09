import Link from "next/link";
import type { Metadata } from "next";
import PublishedMediaSection from "@/components/published-media-section";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Global Business Services | Power BI, Excel, M365, AI | TMG",
  description: "Global services powered from Doha: Business Intelligence (Power BI, Advanced Excel), Microsoft 365 Productivity, AI Automation, Company Formation, PRO & Website Growth - delivered online worldwide.",
  alternates: { canonical: "https://tmgbusinessconsulting.com/services" },
};

const services = [
  { name: "Business Intelligence & Analytics", description: "Turn data into decisions. Power BI dashboards, advanced Excel modeling, KPI tracking and business performance analysis.", benefits: ["Power BI Dashboards & Reporting","Advanced Excel - Modeling & Automation","KPI Analysis & Opportunity Mapping"], href: "/booking?service=bi-analytics", badge: "Power BI • Excel" },
  { name: "Microsoft 365 Digital Workplace", description: "Work smarter with M365. Teams, SharePoint, Outlook mastery, documentation systems and workflow optimization.", benefits: ["Microsoft 365 Suite - Teams, SharePoint","Documentation & Workflow Systems","Excel Productivity & Process Automation"], href: "/booking?service=m365-productivity", badge: "M365 Suite" },
  { name: "AI Consulting & Process Automation", description: "Strategy, automation, and AI workflows to improve efficiency and decision making - delivered online.", benefits: ["AI Opportunity Mapping","Process Automation Roadmap","Implementation Support"], href: "/booking?service=ai-automation", badge: "Online Delivery" },
  { name: "Company Formation & Global Setup", description: "Global business setup guidance: US LLC, UK LTD, UAE, Qatar hub - documents, bank, compliance handled online.", benefits: ["Setup Pathway Guidance","Documents & Compliance Overview","Remote Execution"], href: "/booking?service=company-formation", badge: "Global • Qatar Hub" },
  { name: "PRO & Document Clearing - Remote", description: "Administrative requirements and document processing handled remotely via secure portal.", benefits: ["Requirements Guidance","Document Preparation","Process Coordination"], href: "/booking?service=pro-services", badge: "Remote Handling" },
  { name: "Website & Digital Growth", description: "Website audit, messaging strategy and conversion improvements for stronger digital presence.", benefits: ["Website Audit","Messaging & Conversion Strategy","Lead Generation Improvements"], href: "/booking?service=website-growth", badge: "Online Delivery" },
  { name: "SecureFind - Find Verified Suppliers", description: "Find verified suppliers and business partners safely. 100% legal, owner-only verification - no middlemen, no scams.", benefits: ["Verified Suppliers Only","100% Legal & Owner Only","Direct Contact - No Middlemen"], href: "/securefind", badge: "100% Legal • Owner Only" },
  { name: "TMG Academy - Training & Workshops", description: "Practical leadership, AI, business analysis and productivity training for teams in Qatar and worldwide. Tailored workshops for your organization.", benefits: ["Leadership & Team Development","AI Tools & Responsible Adoption","Productivity & Workflow Improvement"], href: "/training", badge: "Workshops • Teams" },
];

export default function ServicesPage() {
  return (
    <div className="mx-auto px-6 py-16" style={{ maxWidth: "var(--container-max)" }}>
      <div className="text-center max-w-3xl mx-auto">
        <p className="uppercase tracking-[0.2em] text-xs font-semibold" style={{ color: "var(--gold)" }}>Services - Global, Powered from Doha</p>
        <h1 className="mt-3 font-bold tracking-tight text-4xl md:text-5xl">Global Business Services, Delivered Online</h1>
        <p className="mt-4 leading-7 text-slate-600">Power BI, Advanced Excel, Microsoft 365, AI automation, company formation and growth support. Operated from Doha, serving clients worldwide.</p>
      </div>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((s) => (
          <div key={s.name} className="border bg-white p-8 shadow-sm flex flex-col rounded-[20px]">
            <div className="flex justify-between gap-4"><h2 className="text-xl font-bold">{s.name}</h2><span className="px-3 py-1 rounded-full text-[10px] font-bold" style={{ background: "#FFF9E5", color: "#D4AF37" }}>{s.badge}</span></div>
            <p className="mt-4 text-slate-600 text-sm flex-1">{s.description}</p>
            <ul className="mt-6 space-y-2 text-sm text-slate-700">{s.benefits.map(b => <li key={b} className="flex gap-2"><span style={{ color: "#D4AF37" }}>✓</span>{b}</li>)}</ul>
            <Link href={s.href} className="mt-8 inline-flex px-6 py-3 text-white text-sm font-bold rounded-full w-fit" style={{ background: "var(--primary)" }}>{s.href === "/securefind" ? "Explore SecureFind" : s.href === "/training" ? "View Training Programs" : "Request Quote"}</Link>
          </div>
        ))}
      </div>
      <PublishedMediaSection location="services" title="Services in action" />
    </div>
  );
}


