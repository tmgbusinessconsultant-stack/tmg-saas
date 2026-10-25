"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const TOOLS = [
  { id: "business-plan", name: "Business Plan", desc: "Investor-ready plans tailored to your market and model.", href: "/ai-tools/business-plan" },
  { id: "cv-builder", name: "CV Builder", desc: "ATS-friendly CVs tailored to your target role.", href: "/ai-tools/cv-builder" },
  { id: "business-assistant", name: "Business Assistant", desc: "Conversational support for setup, strategy, and next steps.", href: "/ai-tools/business-assistant" },
  { id: "cover-letter", name: "Cover Letter", desc: "Tailored letters that match your CV and JD.", href: "/ai-tools/cover-letter" },
  { id: "document-review", name: "Document Review", desc: "Review and improve business documents with AI.", href: "/ai-tools/document-review" },
  { id: "policy-generator", name: "Policy Generator", desc: "Company policies and HR docs compliant with Qatar & GCC.", href: "/ai-tools/policy-generator" },
  { id: "business-contracts", name: "Business Contracts", desc: "Professional contracts and agreements.", href: "/ai-tools/business-contracts" },
  { id: "proposal-packs", name: "Proposal Packs", desc: "Client proposals and pitch decks.", href: "/ai-tools/proposal-packs" },
  { id: "sop-builder", name: "SOP Generator", desc: "Workflows and operational processes for teams.", href: "/ai-tools/sop-builder" },
  { id: "risk-assessment", name: "Risk Assessment", desc: "Evaluate operational, market, and strategic risks.", href: "/ai-tools/risk-assessment" },
  { id: "productivity-planner", name: "Productivity Planner", desc: "Daily and weekly plans for greater focus.", href: "/ai-tools/productivity-planner" },
];

export default function AiToolsPage() {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
    if (!token) { setLoading(false); return; }
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
    fetch(`${apiUrl}/user-plans/current`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(p => { setPlan(p); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function canAccess(toolId: string) {
    if (!plan) return false;
    if (plan.allowedTools?.includes(toolId)) return true;
    if (plan.allowedTools?.includes("all")) return true;
    if (plan.planId === "business") return true;
    if (plan.planId === "pro" && ["business-plan", "cv-builder", "business-assistant", "cover-letter", "document-review", "policy-generator"].includes(toolId)) return true;
    if (["cv-builder", "business-assistant"].includes(toolId)) return true;
    return false;
  }

  return (
    <div className="min-h-screen bg-[#FCFCF9]">
      <div className="max-w-7xl mx-auto px-6 py-14 md:py-20">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">AI Tools • TMG</p>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 leading-[1.1]">Turn ideas into action</h1>
          <p className="mt-4 text-[15px] text-zinc-500">Premium AI business support — compliant, global, investor-ready.</p>

          <div className="mt-6 flex justify-center">
            {loading ? (
              <span className="text-xs rounded-full border border-zinc-200 bg-white px-4 py-2 text-zinc-500">Checking plan...</span>
            ) : plan?.planId ? (
              <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-zinc-900 capitalize">{plan.planId}</span>
                <span className="text-zinc-400">•</span>
                <span className="text-zinc-500">{plan.usageCount}/{plan.usageLimit} uses</span>
                <span className="text-zinc-400">•</span>
                <span className="text-zinc-500">{plan.daysLeft}d left</span>
              </div>
            ) : (
              <div className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs text-zinc-600">
                No active plan. <Link href="/pricing" className="font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4">View pricing</Link>
              </div>
            )}
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS.map((tool) => {
            const locked = !loading && plan && !canAccess(tool.id);
            const noPlan = !loading && !plan;
            return (
              <div key={tool.id} className="group rounded-[24px] border border-zinc-200 bg-white p-6 md:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-zinc-900 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)] transition-all">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-[12px] bg-zinc-900 grid place-items-center">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#D4AF37] group-hover:scale-125 transition-transform" />
                  </div>
                  {(locked || noPlan) && (
                    <span className="text-[11px] rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-1 font-medium text-zinc-500">Locked</span>
                  )}
                </div>
                <h2 className="mt-5 text-[17px] font-semibold tracking-tight text-zinc-900">{tool.name}</h2>
                <p className="mt-2 text-[13px] leading-6 text-zinc-500 min-h-[48px]">{tool.desc}</p>

                <div className="mt-6">
                  {noPlan ? (
                    <Link href="/pricing" className="inline-flex w-full justify-center rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white transition-colors">View plans to unlock</Link>
                  ) : locked ? (
                    <div className="flex gap-2">
                      <span className="flex-1 rounded-full bg-zinc-50 border border-zinc-200 px-4 py-3 text-xs font-medium text-zinc-500 text-center">{plan.planId} plan</span>
                      <Link href="/pricing" className="rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-[#C9A635] transition-colors">Upgrade</Link>
                    </div>
                  ) : (
                    <Link href={tool.href} className="inline-flex w-full justify-center rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black transition-colors">Use tool</Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}