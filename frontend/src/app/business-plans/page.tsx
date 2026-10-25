"use client";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/project-delivery";

type Template = "International Investor" | "Qatar Investor" | "US SBA" | "UK Bank";
type PlanDoc = { id: string; title: string; template: string; createdAt: string };

const API_FILE = "/business-plans/file";

const STEPS = [
    { id: 1, name: "Business Info", pct: 10 },
    { id: 2, name: "Overview", pct: 25 },
    { id: 3, name: "Products", pct: 40 },
    { id: 4, name: "Market", pct: 55 },
    { id: 5, name: "Marketing", pct: 70 },
    { id: 6, name: "Operations", pct: 85 },
    { id: 7, name: "Financials", pct: 100 },
];

const COUNTRIES = [
    { name: "Qatar", currency: "QAR", symbol: "QAR" },
    { name: "United States", currency: "USD", symbol: "$" },
    { name: "United Kingdom", currency: "GBP", symbol: "£" },
    { name: "Saudi Arabia", currency: "SAR", symbol: "SAR" },
    { name: "UAE", currency: "AED", symbol: "AED" },
    { name: "Canada", currency: "CAD", symbol: "C$" },
    { name: "Australia", currency: "AUD", symbol: "A$" },
    { name: "Germany", currency: "EUR", symbol: "€" },
    { name: "India", currency: "INR", symbol: "₹" },
    { name: "Singapore", currency: "SGD", symbol: "S$" },
] as const;

const INDUSTRIES = ["Technology", "Logistics & Supply Chain", "E-commerce", "Consulting", "Real Estate", "Healthcare", "Education", "Food & Beverage", "Construction", "Manufacturing", "Finance", "Import/Export", "Energy", "Other"];
const STAGES = ["Idea", "Startup", "Pre-Revenue", "Early Revenue", "Growth", "Expansion", "Mature"];
const LEGAL: Record<string, string[]> = {
    Qatar: ["QFC LLC", "WLL", "Free Zone LLC", "Sole Establishment"],
    "United States": ["LLC", "C-Corp", "S-Corp", "Partnership"],
    "United Kingdom": ["Ltd", "LLP", "Sole Trader"],
    Default: ["LLC", "Private Limited", "Corporation", "Partnership", "Free Zone LLC"]
};

const initialForm = {
    businessName: "", industry: "", country: "Qatar", city: "Doha", businessStage: "Startup", legalStructure: "QFC LLC",
    businessDescription: "", missionStatement: "", visionStatement: "", businessGoals: "",
    mainProduct: "", additionalProducts: "", problemSolved: "", usp: "", whyChooseYou: "",
    targetCustomers: "", marketSize: "", ageGroup: "", painPoints: "", industryTrends: "",
    competitor1Name: "", competitor1Strengths: "", competitor1Weaknesses: "",
    competitor2Name: "", competitor2Strengths: "", competitor2Weaknesses: "",
    competitor3Name: "", competitor3Strengths: "", competitor3Weaknesses: "",
    marketingChannels: [] as string[], brandPositioning: "", salesStrategy: "", customerAcquisition: "",
    businessLocation: "", businessProcesses: "", suppliers: "", technologyUsed: "",
    founderName: "", experienceYears: "", keySkills: "", teamMembers: "",
    startupCost: "", monthlyExpenses: "", revenueModel: "", monthlyRevenue: "", annualRevenue: "", fundingRequired: "", breakEven: "",
    businessRisks: "", mitigationStrategy: "",
};

export default function BusinessPlanForm() {
    const [token, setToken] = useState("");
    const [template, setTemplate] = useState<Template>("International Investor");
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState<PlanDoc[]>([]);
    const [form, setForm] = useState(initialForm);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const selected = COUNTRIES.find(c => c.name === form.country) || COUNTRIES[0];
    const legalOptions = LEGAL[form.country] || LEGAL.Default;

    useEffect(() => { setToken(sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken") || ""); }, []);
    useEffect(() => { if (token) load(); }, [token]);

    const load = async () => {
        try { const d = await apiRequest<PlanDoc[]>("/business-plans", token); setPlans(d); } catch { }
    };

    const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

    const validate = () => {
        if (step === 1 && !form.businessName.trim()) { setError("Business name required"); return false; }
        if (step === 2 && !form.businessDescription.trim()) { setError("Business description required"); return false; }
        setError(""); return true;
    };

    const next = () => { if (!validate()) return; setStep(s => Math.min(7, s + 1)); };
    const back = () => { setError(""); setStep(s => Math.max(1, s - 1)); };

    const submit = async () => {
        if (!validate()) return;
        setLoading(true); setError(""); setSuccess("");
        try {
            const payload = {
                title: `${form.businessName} - ${template} Plan`,
                template: `${template} - ${form.country} (${selected.currency})`,
                ...form,
                executiveSummary: form.businessDescription,
                marketAnalysis: `${form.country} | ${form.targetCustomers} | ${form.marketSize}`,
                financials: `${selected.currency} | Startup ${form.startupCost} | Funding ${form.fundingRequired}`,
            };
            const res = await apiRequest<PlanDoc>("/business-plans", token, { method: "POST", body: JSON.stringify(payload) });
            setPlans([res, ...plans]); setSuccess(`${template} — ${form.country} (${selected.currency}) generated`);
        } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    };

    const pct = STEPS.find(s => s.id === step)?.pct || 10;

    const inputCls = "w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none";
    const labelCls = "text-[11px] font-semibold uppercase tracking-wider text-zinc-500";

    return (
        <div className="min-h-screen bg-[#FCFCF9]">
            <div className="max-w-[1400px] mx-auto px-6 py-8 md:py-10">
                <div className="rounded-[24px] border border-zinc-200 bg-white p-6 md:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">Business Plan • International</p>
                            <h1 className="mt-2 text-xl font-bold tracking-tight text-zinc-900">AI Business Plan Generator</h1>
                        </div>
                        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">{pct}%</span>
                    </div>
                    <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <select value={template} onChange={e => setTemplate(e.target.value as Template)} className={inputCls + " font-medium"}>
                            <option>International Investor</option><option>Qatar Investor</option><option>US SBA</option><option>UK Bank</option>
                        </select>
                        <div className="rounded-[12px] border border-zinc-100 bg-zinc-50 px-3 py-3 text-xs text-zinc-600">
                            {template} • {form.country} • {selected.currency}
                        </div>
                        <select value={form.country} onChange={e => set(e, set("country", e.target.value))} className={inputCls}><option value="">Country</option>{COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name} — {c.currency}</option>)}</select>
                        <div className="hidden md:flex items-center gap-2 text-[10px] text-zinc-400">{STEPS.map(s => <div key={s.id} className={`flex items-center gap-1 ${step >= s.id ? "text-zinc-900 font-semibold" : ""}`}><span className={`h-5 w-5 grid place-items-center rounded-full border ${step >= s.id ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200"}`}>{step > s.id ? "✓" : s.id}</span>{s.name}</div>)}</div>
                    </div>
                    <div className="mt-5 h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden"><div className="h-full bg-[#D4AF37] transition-all" style={{ width: `${pct}%` }} /></div>
                    {error && <p className="mt-4 text-xs rounded-[12px] bg-red-50 border border-red-200 p-3 text-red-700">{error}</p>}
                    {success && <p className="mt-4 text-xs rounded-[12px] bg-emerald-50 border border-emerald-200 p-3 text-emerald-700">{success}</p>}
                </div>

                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 lg:col-span-8 rounded-[24px] border border-zinc-200 bg-white p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                        {step === 1 && (
                            <div className="space-y-4">
                                <h2 className="font-semibold text-zinc-900">Business Information — {selected.name}</h2>
                                <div><label className={labelCls}>Business Name *</label><input value={form.businessName} onChange={e => set("businessName", e.target.value)} placeholder="Doha Tech Logistics WLL" className={inputCls + " mt-1.5"} /></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className={labelCls}>Industry</label><select value={form.industry} onChange={e => set("industry", e.target.value)} className={inputCls + " mt-1.5"}><option value="">Select</option>{INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
                                    <div><label className={labelCls}>City</label><input value={form.city} onChange={e => set("city", e.target.value)} className={inputCls + " mt-1.5"} /></div>
                                    <div><label className={labelCls}>Stage</label><select value={form.businessStage} onChange={e => set("businessStage", e.target.value)} className={inputCls + " mt-1.5"}>{STAGES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                                    <div><label className={labelCls}>Legal — {form.country}</label><select value={form.legalStructure} onChange={e => set("legalStructure", e.target.value)} className={inputCls + " mt-1.5"}>{legalOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                                </div>
                            </div>
                        )}
                        {step === 2 && (
                            <div className="space-y-4">
                                <h2 className="font-semibold">Executive Overview</h2>
                                <div><label className={labelCls}>Business Description *</label><textarea value={form.businessDescription} onChange={e => set("businessDescription", e.target.value)} rows={4} className={inputCls + " mt-1.5"} /></div>
                                <div className="grid grid-cols-2 gap-3"><div><label className={labelCls}>Mission</label><textarea value={form.missionStatement} onChange={e => set("missionStatement", e.target.value)} rows={2} className={inputCls + " mt-1.5"} /></div><div><label className={labelCls}>Vision</label><textarea value={form.visionStatement} onChange={e => set("visionStatement", e.target.value)} rows={2} className={inputCls + " mt-1.5"} /></div></div>
                                <div><label className={labelCls}>Goals</label><textarea value={form.businessGoals} onChange={e => set("businessGoals", e.target.value)} rows={2} className={inputCls + " mt-1.5"} /></div>
                            </div>
                        )}
                        {step === 3 && (
                            <div className="space-y-4"><h2 className="font-semibold">Products & Services</h2>
                                <div><label className={labelCls}>Main Product</label><textarea value={form.mainProduct} onChange={e => set("mainProduct", e.target.value)} rows={2} className={inputCls + " mt-1.5"} /></div>
                                <div><label className={labelCls}>Problem Solved</label><textarea value={form.problemSolved} onChange={e => set("problemSolved", e.target.value)} rows={2} className={inputCls + " mt-1.5"} /></div>
                                <div className="grid grid-cols-2 gap-3"><div><label className={labelCls}>USP</label><textarea value={form.usp} onChange={e => set("usp", e.target.value)} rows={2} className={inputCls + " mt-1.5"} /></div><div><label className={labelCls}>Why Choose You</label><textarea value={form.whyChooseYou} onChange={e => set("whyChooseYou", e.target.value)} rows={2} className={inputCls + " mt-1.5"} /></div></div>
                            </div>
                        )}
                        {step === 4 && (
                            <div className="space-y-4"><h2 className="font-semibold">Market & Competition</h2>
                                <div className="grid grid-cols-2 gap-3"><input placeholder={`Target Customers`} value={form.targetCustomers} onChange={e => set("targetCustomers", e.target.value)} className={inputCls} /><input placeholder={`Market Size ${selected.symbol}`} value={form.marketSize} onChange={e => set("marketSize", e.target.value)} className={inputCls} /></div>
                                <textarea placeholder="Pain Points" value={form.painPoints} onChange={e => set("painPoints", e.target.value)} rows={2} className={inputCls} />
                                <div className="grid grid-cols-3 gap-3">{[1, 2, 3].map(n => <div key={n} className="rounded-[12px] border border-zinc-100 bg-zinc-50 p-3"><p className="text-[10px] font-bold">Competitor {n}</p><input placeholder="Name" value={(form as any)[`competitor${n}Name`]} onChange={e => set(`competitor${n}Name`, e.target.value)} className="mt-2 w-full rounded-[8px] border border-zinc-200 p-2 text-xs" /><input placeholder="Strengths" value={(form as any)[`competitor${n}Strengths`]} onChange={e => set(`competitor${n}Strengths`, e.target.value)} className="mt-2 w-full rounded-[8px] border border-zinc-200 p-2 text-xs" /></div>)}</div>
                            </div>
                        )}
                        {step === 5 && (
                            <div className="space-y-4"><h2 className="font-semibold">Marketing & Sales</h2>
                                <div className="flex flex-wrap gap-2">{["Social Media", "Google Ads", "LinkedIn", "Qatar Chamber", "SEO", "Referrals"].map(ch => <button key={ch} onClick={() => set("marketingChannels", form.marketingChannels.includes(ch) ? form.marketingChannels.filter(c => c !== ch) : [...form.marketingChannels, ch])} className={`rounded-full border px-3 py-1.5 text-xs ${form.marketingChannels.includes(ch) ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-200"}`}>{ch}</button>)}</div>
                                <textarea placeholder="Brand Positioning" value={form.brandPositioning} onChange={e => set("brandPositioning", e.target.value)} rows={2} className={inputCls} /><textarea placeholder="Sales Strategy" value={form.salesStrategy} onChange={e => set("salesStrategy", e.target.value)} rows={2} className={inputCls} />
                            </div>
                        )}
                        {step === 6 && (
                            <div className="space-y-4"><h2 className="font-semibold">Operations & Team</h2>
                                <div className="grid grid-cols-2 gap-3"><input placeholder="Business Location" value={form.businessLocation} onChange={e => set("businessLocation", e.target.value)} className={inputCls} /><input placeholder="Founder" value={form.founderName} onChange={e => set("founderName", e.target.value)} className={inputCls} /></div>
                                <textarea placeholder="Business Processes" value={form.businessProcesses} onChange={e => set("businessProcesses", e.target.value)} rows={2} className={inputCls} />
                            </div>
                        )}
                        {step === 7 && (
                            <div className="space-y-4"><h2 className="font-semibold">Financials — {selected.currency} ({selected.symbol})</h2>
                                <div className="grid grid-cols-3 gap-3"><input placeholder={`Startup ${selected.symbol}`} value={form.startupCost} onChange={e => set("startupCost", e.target.value)} className={inputCls} /><input placeholder={`Monthly ${selected.symbol}`} value={form.monthlyExpenses} onChange={e => set("monthlyExpenses", e.target.value)} className={inputCls} /><input placeholder={`Funding ${selected.symbol}`} value={form.fundingRequired} onChange={e => set("fundingRequired", e.target.value)} className={inputCls} /></div>
                                <textarea placeholder="Risks & Mitigation" value={form.mitigationStrategy} onChange={e => set("mitigationStrategy", e.target.value)} rows={3} className={inputCls} />
                                <div className="rounded-[12px] bg-zinc-50 border border-zinc-100 p-4 text-xs text-zinc-600">Deliverables: Investor plan (20-30p), Executive summary ({selected.currency}), SWOT, Market, Financial forecast, {template}</div>
                            </div>
                        )}

                        <div className="mt-8 flex justify-between">
                            <button onClick={back} disabled={step === 1} className="rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm font-medium disabled:opacity-30">Back</button>
                            {step < 7 ? <button onClick={next} className="rounded-full bg-zinc-900 px-8 py-3 text-sm font-semibold text-white hover:bg-black">Next →</button> :
                                <button onClick={submit} disabled={loading} className="rounded-full bg-[#D4AF37] px-8 py-3 text-sm font-bold text-zinc-900 hover:bg-[#C9A635] disabled:opacity-50">{loading ? "Generating..." : `Generate — ${selected.currency}`}</button>}
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-4">
                        <div className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sticky top-6">
                            <h3 className="text-sm font-semibold text-zinc-900">My Plans ({plans.length})</h3>
                            <div className="mt-4 space-y-2 max-h-[60vh] overflow-auto">
                                {plans.map(p => <div key={p.id} className="flex justify-between items-center rounded-[12px] border border-zinc-100 bg-zinc-50 p-3"><div><p className="text-xs font-semibold">{p.title}</p><p className="text-[10px] text-zinc-500">{p.template}</p></div><a href={`${API_FILE}/${p.id}`} target="_blank" className="rounded-full bg-white border border-zinc-200 px-3 py-1 text-xs font-semibold">View</a></div>)}
                                {plans.length === 0 && <p className="text-xs text-zinc-400 text-center py-10 border border-dashed border-zinc-200 rounded-[12px]">No plans yet. Select country — currency auto-detects {selected.symbol}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
