"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const TOOLS = [
  { id: "business-plan", name: "Business Plan Generator", desc: "Create structured, investor-ready business plans tailored to your market and business model.", href: "/ai-tools/business-plan" },
  { id: "cv-builder", name: "CV Builder", desc: "Create an ATS-friendly CV tailored to your target role and experience.", href: "/ai-tools/cv-builder" },
  { id: "business-assistant", name: "Business Assistant", desc: "Get conversational support for business setup, strategy, and practical next steps.", href: "/ai-tools/business-assistant" },
  { id: "cover-letter", name: "Cover Letter Generator", desc: "Generate tailored cover letters that match your CV and job description.", href: "/ai-tools/cover-letter" },
  { id: "document-review", name: "Document Review", desc: "Review and improve business documents with AI-powered analysis.", href: "/ai-tools/document-review" },
  { id: "policy-generator", name: "Policy Generator", desc: "Generate company policies and HR documents compliant with Qatar regulations.", href: "/ai-tools/policy-generator" },
  { id: "business-contracts", name: "Business Contracts", desc: "Generate professional business contracts and agreements.", href: "/ai-tools/business-contracts" },
  { id: "proposal-packs", name: "Proposal Packs", desc: "Create business proposals and client pitch decks.", href: "/ai-tools/proposal-packs" },
  { id: "sop-builder", name: "SOP Generator", desc: "Generate workflows, policies, and operational processes for teams and departments.", href: "/ai-tools/sop-builder" },
  { id: "risk-assessment", name: "Risk Assessment Generator", desc: "Evaluate operational, market, and strategic risks before committing resources.", href: "/ai-tools/risk-assessment" },
  { id: "productivity-planner", name: "Productivity Planner Generator", desc: "Create a practical daily and weekly plan for teams seeking greater focus and consistency.", href: "/ai-tools/productivity-planner" },
];

export default function AiToolsPage() {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
    if (!token) { setLoading(false); return; }
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL||"").replace(/\/+$/,"");
    fetch(`${apiUrl}/user-plans/current`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r=> r.ok ? r.json() : null)
      .then(p=>{ setPlan(p); setLoading(false); })
      .catch(()=>setLoading(false));
  }, []);

  function canAccess(toolId: string) {
    if (!plan) return false;
    if (plan.allowedTools?.includes(toolId)) return true;
    if (plan.allowedTools?.includes("all")) return true;
    // Business gets all
    if (plan.planId === "business") return true;
    // Pro gets first 6
    if (plan.planId === "pro" && ["business-plan","cv-builder","business-assistant","cover-letter","document-review","policy-generator"].includes(toolId)) return true;
    // Starter/trial gets 2
    if (["cv-builder","business-assistant"].includes(toolId)) return true;
    return false;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center max-w-3xl mx-auto">
        <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs font-semibold">AI TOOLS</p>
        <h1 className="mt-3 text-4xl font-bold">Turn ideas into action with AI-powered business support</h1>
        {plan?.planId ? (
          <p className="mt-3 text-sm bg-green-50 border border-green-200 inline-block px-4 py-2 rounded-full">Active: {plan.planId} • {plan.usageCount}/{plan.usageLimit} • {plan.daysLeft} days • Auto-renewal {plan.billingCycle}</p>
        ) : (
          <p className="mt-3 text-sm">No plan. <Link href="/pricing" className="underline font-bold">View pricing</Link> to unlock</p>
        )}
      </div>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        {TOOLS.map((tool) => {
          const locked = !loading && plan && !canAccess(tool.id);
          const noPlan = !loading && !plan;
          return (
            <div key={tool.id} className="rounded-2xl border bg-white p-8 shadow-sm">
              <p className="text-[#D4AF37] text-xs font-semibold uppercase">TMG TOOL</p>
              <h2 className="mt-2 text-xl font-bold">{tool.name}</h2>
              <p className="mt-3 text-slate-600 leading-6 text-sm">{tool.desc}</p>
              {noPlan ? (
                <Link href="/pricing" className="mt-6 inline-block bg-[#0F172A] text-white px-6 py-3 rounded-md font-semibold text-sm">View plans to unlock</Link>
              ) : locked ? (
                <div className="mt-6 flex items-center gap-3">
                  <span className="bg-slate-100 px-4 py-3 rounded-md text-sm">🔒 Locked - {plan.planId} plan</span>
                  <Link href="/pricing" className="bg-[#D4AF37] text-black px-4 py-3 rounded-md font-semibold text-sm">Upgrade</Link>
                </div>
              ) : (
                <Link href={tool.href} className="mt-6 inline-block bg-[#0F172A] text-white px-6 py-3 rounded-md font-semibold text-sm">Use tool</Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

