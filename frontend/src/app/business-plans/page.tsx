"use client";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const getToken = () => typeof window !== "undefined" ? (localStorage.getItem("token") || localStorage.getItem("access_token") || "") : "";

type Template = "International Investor" | "Qatar Investor" | "US SBA" | "UK Bank";

const STEPS = [
    { id: 1, name: "Business Info", pct: 10 },
    { id: 2, name: "Executive Overview", pct: 25 },
    { id: 3, name: "Products & Services", pct: 40 },
    { id: 4, name: "Market & Competition", pct: 55 },
    { id: 5, name: "Marketing & Sales", pct: 70 },
    { id: 6, name: "Operations & Team", pct: 85 },
    { id: 7, name: "Financials & AI", pct: 100 },
];

// INTERNATIONAL DATA
const COUNTRIES = [
    { name: "Qatar", currency: "QAR", symbol: "QAR" },
    { name: "United States", currency: "USD", symbol: "$" },
    { name: "United Kingdom", currency: "GBP", symbol: "£" },
    { name: "Saudi Arabia", currency: "SAR", symbol: "SAR" },
    { name: "United Arab Emirates", currency: "AED", symbol: "AED" },
    { name: "Canada", currency: "CAD", symbol: "C$" },
    { name: "Australia", currency: "AUD", symbol: "A$" },
    { name: "Germany", currency: "EUR", symbol: "€" },
    { name: "France", currency: "EUR", symbol: "€" },
    { name: "India", currency: "INR", symbol: "₹" },
    { name: "Pakistan", currency: "PKR", symbol: "PKR" },
    { name: "Egypt", currency: "EGP", symbol: "EGP" },
    { name: "Kuwait", currency: "KWD", symbol: "KWD" },
    { name: "Bahrain", currency: "BHD", symbol: "BHD" },
    { name: "Oman", currency: "OMR", symbol: "OMR" },
    { name: "Turkey", currency: "TRY", symbol: "₺" },
    { name: "Nigeria", currency: "NGN", symbol: "₦" },
    { name: "Kenya", currency: "KES", symbol: "KES" },
    { name: "South Africa", currency: "ZAR", symbol: "R" },
    { name: "Singapore", currency: "SGD", symbol: "S$" },
    { name: "Other", currency: "USD", symbol: "$" },
];

const INDUSTRIES = ["Technology", "Logistics & Supply Chain", "E-commerce", "Consulting", "Real Estate", "Healthcare", "Education", "Food & Beverage", "Construction", "Manufacturing", "Marketing Agency", "Finance", "Import/Export", "Transportation", "Energy", "Agriculture", "Other"];
const STAGES = ["Idea", "Startup", "Pre-Revenue", "Early Revenue", "Growth", "Expansion", "Mature"];
const LEGAL_BY_COUNTRY: any = {
    "Qatar": ["QFC LLC", "WLL", "Free Zone LLC", "Sole Establishment", "Branch of Foreign Company"],
    "United States": ["LLC", "C-Corp", "S-Corp", "Partnership", "Sole Proprietorship"],
    "United Kingdom": ["Ltd", "LLP", "Sole Trader", "PLC"],
    "Default": ["LLC", "Private Limited", "Corporation", "Partnership", "Sole Proprietorship", "Free Zone LLC", "Holding Company"]
};
const REVENUE_MODELS = ["SaaS Subscription", "Product Sales", "Service Fees", "Commission / Marketplace", "Advertising", "Freemium", "Licensing", "Transaction Fees", "Subscription + Transaction", "Other"];
const TEAM_SIZES = ["Solo Founder", "2-5 Employees", "6-10 Employees", "11-25 Employees", "25+ Employees"];
const EXPERIENCE = ["0-2 years", "3-5 years", "6-10 years", "10+ years"];

export default function BusinessPlanForm() {
    const [template, setTemplate] = useState<Template>("International Investor");
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState<any[]>([]);
    const [formData, setFormData] = useState({
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
        generateSWOT: true, generateMarketResearch: true, generateComparison: true, generateForecast: true, generateInvestorPitch: true, generateExecutiveSummary: true
    });

    const selectedCountry = COUNTRIES.find(c => c.name === formData.country) || COUNTRIES[0];
    const currencySymbol = selectedCountry.symbol;
    const legalOptions = LEGAL_BY_COUNTRY[formData.country] || LEGAL_BY_COUNTRY["Default"];

    // Dynamic funding based on country
    const getFundingOptions = () => {
        const sym = currencySymbol;
        if (selectedCountry.name === "Qatar") return [`${sym} 50K - 100K`, `${sym} 100K - 300K`, `${sym} 300K - 750K`, `${sym} 750K - 1.5M`, `${sym} 1.5M - 3M`, `${sym} 3M+`];
        if (selectedCountry.name === "United States") return [`$10K - 50K`, `$50K - 100K`, `$100K - 250K`, `$250K - 500K SBA 7(a)`, `$500K - 1M`, `$1M+`];
        if (selectedCountry.name === "United Kingdom") return [`£10K - 50K`, `£50K - 100K`, `£100K - 250K`, `£250K - 500K`, `£500K+`];
        return [`${sym} 10K - 50K`, `${sym} 50K - 100K`, `${sym} 100K - 250K`, `${sym} 250K - 500K`, `${sym} 500K - 1M`, `${sym} 1M+`];
    };

    const loadPlans = async () => { try { const r = await fetch(`${API_URL}/business-plans`, { headers: { Authorization: `Bearer ${getToken()}` } }); const d = await r.json(); if (Array.isArray(d)) setPlans(d); } catch { } };
    useEffect(() => { loadPlans(); }, []);

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleChannel = (ch: string) => {
        setFormData(p => ({ ...p, marketingChannels: p.marketingChannels.includes(ch) ? p.marketingChannels.filter(c => c !== ch) : [...p.marketingChannels, ch] }));
    };

    const next = () => { if (step === 1 && !formData.businessName) { alert("Business Name required"); return; } if (step === 2 && !formData.businessDescription) { alert("Business Description required"); return; } setStep(s => Math.min(7, s + 1)); };
    const back = () => setStep(s => Math.max(1, s - 1));

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                title: `${formData.businessName} - ${template} Plan`,
                template: `${template} - ${formData.country} (${selectedCountry.currency})`,
                businessName: formData.businessName,
                industry: formData.industry,
                executiveSummary: `Description: ${formData.businessDescription}\nMission: ${formData.missionStatement}\nVision: ${formData.visionStatement}\nGoals: ${formData.businessGoals}`,
                marketAnalysis: `Country: ${formData.country} | Currency: ${selectedCountry.currency} | Target: ${formData.targetCustomers} | Market Size: ${formData.marketSize} | Trends: ${formData.industryTrends}`,
                products: `Main: ${formData.mainProduct}\nUSP: ${formData.usp}\nWhy: ${formData.whyChooseYou}`,
                financials: `Country: ${formData.country} | Currency: ${selectedCountry.currency} | Startup: ${currencySymbol} ${formData.startupCost} | Monthly: ${formData.monthlyExpenses} | Model: ${formData.revenueModel} | Funding: ${formData.fundingRequired} | Legal: ${formData.legalStructure}`,
                fundingAsk: `Funding: ${formData.fundingRequired} (${currencySymbol}) | Template: ${template} | Risks: ${formData.businessRisks} | Mitigation: ${formData.mitigationStrategy}`,
            };
            const res = await fetch(`${API_URL}/business-plans`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(payload) });
            const result = await res.json(); if (!res.ok) throw new Error(result.message);
            setPlans([result, ...plans]); alert(`✅ ${template} - ${formData.country} (${selectedCountry.currency}) Generated!`);
        } catch (e: any) { alert(e.message); } setLoading(false);
    };

    const currentPct = STEPS.find(s => s.id === step)?.pct || 10;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <div className="max-w-[1400px] mx-auto p-4 md:p-6">
                <div className="bg-[#141414] rounded-[16px] border border-white/10 p-5 mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <h1 className="font-bold">AI Business Plan Generator <span className="text-[10px] bg-[#D4AF37] text-black px-2 py-0.5 rounded ml-2">INTERNATIONAL</span></h1>
                        <div className="flex gap-2 items-center">
                            <span className="text-[10px] bg-white/10 px-2 py-1 rounded">{currentPct}% Complete</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-12 gap-3 mb-3">
                        <div className="col-span-6 md:col-span-6">
                            <label className="text-[10px] text-white/50 uppercase">Plan Type *</label>
                            <select value={template} onChange={e => setTemplate(e.target.value as any)} className="w-full mt-1 bg-white text-black rounded-lg px-3 py-2.5 text-xs font-bold">
                                <option value="International Investor">🌍 International Investor-Ready (Any Country)</option>
                                <option value="Qatar Investor">🇶🇦 Qatar Investor - QFC / QDB</option>
                                <option value="US SBA">🇺🇸 US SBA 7(a) - Bank Ready</option>
                                <option value="UK Bank">🇬🇧 UK / EU Bank Loan Ready</option>
                            </select>
                        </div>
                        <div className="col-span-6 md:col-span-6">
                            <label className="text-[10px] text-white/50 uppercase">Currency Auto: {currencySymbol} ({selectedCountry.currency})</label>
                            <div className="mt-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white/70">{template} • {formData.country} • {selectedCountry.currency} • {template === "Qatar Investor" ? "QFC Compliant" : template === "US SBA" ? "SBA Form 1919" : "International Standard"}</div>
                        </div>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden"><div className="h-full bg-[#D4AF37] transition-all" style={{ width: `${currentPct}%` }} /></div>
                    <div className="hidden md:flex justify-between mt-3">{STEPS.map(s => (<div key={s.id} className={`text-[10px] flex items-center gap-1 ${step >= s.id ? "text-[#D4AF37] font-bold" : "text-white/40"}`}><div className={`w-5 h-5 rounded-full flex items-center justify-center border ${step >= s.id ? "bg-[#D4AF37] text-black border-[#D4AF37]" : "border-white/20"}`}>{step > s.id ? "✓" : s.id}</div>{s.name}</div>))}</div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 lg:col-span-8 bg-[#141414] rounded-[20px] border border-white/10 p-7">
                        {step === 1 && (
                            <div>
                                <h2 className="text-lg font-bold mb-1">Business Information - {selectedCountry.name}</h2><p className="text-xs text-white/50 mb-6">10% • Currency auto: {currencySymbol}</p>
                                <label className="text-[11px] text-white/60 uppercase">Business Name *</label>
                                <input name="businessName" value={formData.businessName} onChange={handleChange} placeholder="e.g. Doha Tech Logistics WLL" className="w-full bg-white text-black rounded-lg p-3 text-sm mb-3" />
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="text-[11px] text-white/60 uppercase">Industry *</label><select name="industry" value={formData.industry} onChange={handleChange} className="w-full bg-white text-black rounded-lg p-3 text-sm"><option value="">Select Industry</option>{INDUSTRIES.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                                    <div><label className="text-[11px] text-white/60 uppercase">Country * - Determines Currency</label><select name="country" value={formData.country} onChange={handleChange} className="w-full bg-white text-black rounded-lg p-3 text-sm font-bold"><option value="">Select Country</option>{COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name} - {c.currency}</option>)}</select></div>
                                    <div><label className="text-[11px] text-white/60 uppercase">City</label><input name="city" value={formData.city} onChange={handleChange} className="w-full bg-white text-black rounded-lg p-3 text-sm" /></div>
                                    <div><label className="text-[11px] text-white/60 uppercase">Business Stage</label><select name="businessStage" value={formData.businessStage} onChange={handleChange} className="w-full bg-white text-black rounded-lg p-3 text-sm"><option value="">Select Stage</option>{STAGES.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                                </div>
                                <div className="mt-3"><label className="text-[11px] text-white/60 uppercase">Legal Structure * - Auto for {formData.country}</label><select name="legalStructure" value={formData.legalStructure} onChange={handleChange} className="w-full bg-white text-black rounded-lg p-3 text-sm"><option value="">Select Legal Structure</option>{legalOptions.map((o: string) => <option key={o} value={o}>{o}</option>)}</select></div>
                            </div>
                        )}

                        {step === 2 && (
                            <div>
                                <h2 className="text-lg font-bold">Executive Overview</h2>
                                <label className="text-[11px] text-white/60 uppercase mt-3 block">Business Description *</label><textarea name="businessDescription" value={formData.businessDescription} onChange={handleChange} rows={4} placeholder="What does your business do?" className="w-full bg-white text-black rounded-lg p-3 text-sm" />
                                <label className="text-[11px] text-white/60 uppercase mt-3 block">Mission Statement</label><textarea name="missionStatement" value={formData.missionStatement} onChange={handleChange} rows={2} className="w-full bg-white text-black rounded-lg p-3 text-sm" />
                                <label className="text-[11px] text-white/60 uppercase mt-3 block">Vision Statement</label><textarea name="visionStatement" value={formData.visionStatement} onChange={handleChange} rows={2} className="w-full bg-white text-black rounded-lg p-3 text-sm" />
                                <label className="text-[11px] text-white/60 uppercase mt-3 block">Business Goals</label><textarea name="businessGoals" value={formData.businessGoals} onChange={handleChange} rows={2} className="w-full bg-white text-black rounded-lg p-3 text-sm" />
                            </div>
                        )}

                        {step === 3 && (
                            <div>
                                <h2 className="text-lg font-bold">Products & Services</h2>
                                <label className="text-[11px] text-white/60 uppercase mt-3 block">Main Product *</label><textarea name="mainProduct" value={formData.mainProduct} onChange={handleChange} rows={2} className="w-full bg-white text-black rounded-lg p-3 text-sm" />
                                <label className="text-[11px] text-white/60 uppercase mt-3 block">Additional Products</label><textarea name="additionalProducts" value={formData.additionalProducts} onChange={handleChange} rows={2} className="w-full bg-white text-black rounded-lg p-3 text-sm" />
                                <label className="text-[11px] text-white/60 uppercase mt-3 block">Problem Solved</label><textarea name="problemSolved" value={formData.problemSolved} onChange={handleChange} rows={2} className="w-full bg-white text-black rounded-lg p-3 text-sm" />
                                <label className="text-[11px] text-white/60 uppercase mt-3 block">USP</label><textarea name="usp" value={formData.usp} onChange={handleChange} rows={2} className="w-full bg-white text-black rounded-lg p-3 text-sm" />
                                <label className="text-[11px] text-white/60 uppercase mt-3 block">Why Choose You</label><textarea name="whyChooseYou" value={formData.whyChooseYou} onChange={handleChange} rows={2} className="w-full bg-white text-black rounded-lg p-3 text-sm" />
                            </div>
                        )}

                        {step === 4 && (
                            <div>
                                <h2 className="text-lg font-bold">Market & Competition</h2>
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <div><label className="text-[11px] text-white/60 uppercase">Target Customers</label><input name="targetCustomers" value={formData.targetCustomers} onChange={handleChange} className="w-full bg-white text-black rounded-lg p-3 text-sm" /></div>
                                    <div><label className="text-[11px] text-white/60 uppercase">Market Size ({currencySymbol})</label><input name="marketSize" value={formData.marketSize} onChange={handleChange} placeholder={`e.g. ${currencySymbol} 12B`} className="w-full bg-white text-black rounded-lg p-3 text-sm" /></div>
                                    <div><label className="text-[11px] text-white/60 uppercase">Age Group</label><select name="ageGroup" value={formData.ageGroup} onChange={handleChange} className="w-full bg-white text-black rounded-lg p-3 text-sm"><option value="">Select</option><option>18-24</option><option>25-34</option><option>35-44</option><option>B2B - Businesses</option><option>All Ages</option></select></div>
                                    <div><label className="text-[11px] text-white/60 uppercase">Industry Trends</label><input name="industryTrends" value={formData.industryTrends} onChange={handleChange} className="w-full bg-white text-black rounded-lg p-3 text-sm" /></div>
                                </div>
                                <label className="text-[11px] text-white/60 uppercase mt-3 block">Pain Points</label><textarea name="painPoints" value={formData.painPoints} onChange={handleChange} rows={2} className="w-full bg-white text-black rounded-lg p-3 text-sm" />
                                <div className="grid grid-cols-3 gap-3 mt-4">
                                    {[1, 2, 3].map(n => (
                                        <div key={n} className="bg-black/50 p-3 rounded-xl border border-white/10">
                                            <p className="text-[10px] font-bold mb-2">Competitor {n}</p>
                                            <input name={`competitor${n}Name`} value={(formData as any)[`competitor${n}Name`]} onChange={handleChange} placeholder={`Name ${n}`} className="w-full bg-white text-black rounded-lg p-2 text-xs mb-2" />
                                            <input name={`competitor${n}Strengths`} value={(formData as any)[`competitor${n}Strengths`]} onChange={handleChange} placeholder="Strengths" className="w-full bg-white text-black rounded-lg p-2 text-xs mb-2" />
                                            <input name={`competitor${n}Weaknesses`} value={(formData as any)[`competitor${n}Weaknesses`]} onChange={handleChange} placeholder="Weaknesses" className="w-full bg-white text-black rounded-lg p-2 text-xs" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 5 && (
                            <div>
                                <h2 className="text-lg font-bold">Marketing & Sales</h2>
                                <div className="flex flex-wrap gap-2 mt-3 mb-4">
                                    {["Social Media", "Google Ads", "LinkedIn", "Qatar Chamber", "QDB", "SBA Lenders", "Referrals", "SEO", "Trade Shows"].map(ch => (
                                        <button key={ch} type="button" onClick={() => handleChannel(ch)} className={`px-3 py-1.5 rounded-full text-xs border ${formData.marketingChannels.includes(ch) ? "bg-[#D4AF37] text-black border-[#D4AF37] font-bold" : "bg-white/10 border-white/10"}`}>{ch}</button>
                                    ))}
                                </div>
                                <label className="text-[11px] text-white/60 uppercase block">Brand Positioning</label><textarea name="brandPositioning" value={formData.brandPositioning} onChange={handleChange} rows={2} className="w-full bg-white text-black rounded-lg p-3 text-sm mb-3" />
                                <label className="text-[11px] text-white/60 uppercase block">Sales Strategy</label><textarea name="salesStrategy" value={formData.salesStrategy} onChange={handleChange} rows={2} className="w-full bg-white text-black rounded-lg p-3 text-sm mb-3" />
                                <label className="text-[11px] text-white/60 uppercase block">Customer Acquisition</label><textarea name="customerAcquisition" value={formData.customerAcquisition} onChange={handleChange} rows={2} className="w-full bg-white text-black rounded-lg p-3 text-sm" />
                            </div>
                        )}

                        {step === 6 && (
                            <div>
                                <h2 className="text-lg font-bold">Operations & Team</h2>
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <div><label className="text-[11px] text-white/60 uppercase">Business Location</label><input name="businessLocation" value={formData.businessLocation} onChange={handleChange} className="w-full bg-white text-black rounded-lg p-3 text-sm" /></div>
                                    <div><label className="text-[11px] text-white/60 uppercase">Team Size</label><select name="teamMembers" value={formData.teamMembers} onChange={handleChange} className="w-full bg-white text-black rounded-lg p-3 text-sm"><option value="">Select</option>{TEAM_SIZES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                </div>
                                <label className="text-[11px] text-white/60 uppercase mt-3 block">Business Processes</label><textarea name="businessProcesses" value={formData.businessProcesses} onChange={handleChange} rows={2} className="w-full bg-white text-black rounded-lg p-3 text-sm mb-3" />
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="text-[11px] text-white/60 uppercase">Suppliers</label><textarea name="suppliers" value={formData.suppliers} onChange={handleChange} rows={2} className="w-full bg-white text-black rounded-lg p-3 text-sm" /></div>
                                    <div><label className="text-[11px] text-white/60 uppercase">Technology</label><select name="technologyUsed" value={formData.technologyUsed} onChange={handleChange} className="w-full bg-white text-black rounded-lg p-3 text-sm"><option value="">Select</option><option>AI / Machine Learning</option><option>Web Platform / SaaS</option><option>Mobile App</option><option>E-commerce</option><option>Manual / No Tech</option></select></div>
                                </div>
                                <div className="grid grid-cols-3 gap-3 mt-3">
                                    <div><label className="text-[11px] text-white/60 uppercase">Founder</label><input name="founderName" value={formData.founderName} onChange={handleChange} className="w-full bg-white text-black rounded-lg p-3 text-sm" /></div>
                                    <div><label className="text-[11px] text-white/60 uppercase">Experience</label><select name="experienceYears" value={formData.experienceYears} onChange={handleChange} className="w-full bg-white text-black rounded-lg p-3 text-sm"><option value="">Select</option>{EXPERIENCE.map(e => <option key={e} value={e}>{e}</option>)}</select></div>
                                    <div><label className="text-[11px] text-white/60 uppercase">Key Skills</label><input name="keySkills" value={formData.keySkills} onChange={handleChange} className="w-full bg-white text-black rounded-lg p-3 text-sm" /></div>
                                </div>
                            </div>
                        )}

                        {step === 7 && (
                            <div>
                                <h2 className="text-lg font-bold">Financials & AI Options - {selectedCountry.currency} ({currencySymbol})</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                                    <div><label className="text-[11px] text-white/60 uppercase">Startup Cost ({currencySymbol})</label><input name="startupCost" value={formData.startupCost} onChange={handleChange} className="w-full bg-white text-black rounded-lg p-3 text-sm" /></div>
                                    <div><label className="text-[11px] text-white/60 uppercase">Monthly Expenses ({currencySymbol})</label><input name="monthlyExpenses" value={formData.monthlyExpenses} onChange={handleChange} className="w-full bg-white text-black rounded-lg p-3 text-sm" /></div>
                                    <div><label className="text-[11px] text-white/60 uppercase">Revenue Model</label><select name="revenueModel" value={formData.revenueModel} onChange={handleChange} className="w-full bg-white text-black rounded-lg p-3 text-sm"><option value="">Select Model</option>{REVENUE_MODELS.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                                    <div><label className="text-[11px] text-white/60 uppercase">Monthly Revenue ({currencySymbol})</label><input name="monthlyRevenue" value={formData.monthlyRevenue} onChange={handleChange} className="w-full bg-white text-black rounded-lg p-3 text-sm" /></div>
                                    <div><label className="text-[11px] text-white/60 uppercase">Annual Revenue ({currencySymbol})</label><input name="annualRevenue" value={formData.annualRevenue} onChange={handleChange} className="w-full bg-white text-black rounded-lg p-3 text-sm" /></div>
                                    <div><label className="text-[11px] text-white/60 uppercase">Funding Required *</label><select name="fundingRequired" value={formData.fundingRequired} onChange={handleChange} className="w-full bg-white text-black rounded-lg p-3 text-sm font-bold"><option value="">Select Funding - {selectedCountry.currency}</option>{getFundingOptions().map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <div><label className="text-[11px] text-white/60 uppercase">Break-even</label><select name="breakEven" value={formData.breakEven} onChange={handleChange} className="w-full bg-white text-black rounded-lg p-3 text-sm"><option value="">Select</option><option>3 months</option><option>6 months</option><option>12 months</option><option>18 months</option><option>24 months</option></select></div>
                                    <div><label className="text-[11px] text-white/60 uppercase">Risks</label><select name="businessRisks" value={formData.businessRisks} onChange={handleChange} className="w-full bg-white text-black rounded-lg p-3 text-sm"><option value="">Select Risk Level</option><option>Low Risk - Stable Market</option><option>Medium Risk - Competitive</option><option>High Risk - New Market</option></select></div>
                                </div>
                                <label className="text-[11px] text-white/60 uppercase mt-3 block">Mitigation Strategy</label><textarea name="mitigationStrategy" value={formData.mitigationStrategy} onChange={handleChange} rows={2} className="w-full bg-white text-black rounded-lg p-3 text-sm" />
                                <div className="mt-6 p-5 bg-gradient-to-br from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/20 rounded-xl">
                                    <h4 className="text-xs font-black tracking-widest text-[#D4AF37]">DELIVERABLES - {template} - {formData.country}</h4>
                                    <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] text-white/70">
                                        {["Investor-Ready Plan (20-30 Pages)", `Executive Summary (${selectedCountry.currency})`, "SWOT Analysis", "Market Analysis", "Competitor Analysis", "Marketing Strategy", "Financial Forecast", "Risk Assessment", "Growth Strategy", template === "Qatar Investor" ? "QFC / QDB Section" : template === "US SBA" ? "SBA Form 1919 / Collateral" : "International Bank Section"].map(i => <div key={i}>✅ {i}</div>)}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between mt-8">
                            <button onClick={back} disabled={step === 1} className="px-6 py-3 rounded-xl bg-white/10 text-sm disabled:opacity-20">Back</button>
                            {step < 7 ? <button onClick={next} className="px-8 py-3 rounded-xl bg-white text-black font-bold text-sm">Next →</button> :
                                <button onClick={handleSubmit} disabled={loading} className="px-8 py-3 rounded-xl bg-[#D4AF37] text-black font-black text-sm">{loading ? "GENERATING..." : `Generate International Investor-Ready Business Plan - ${selectedCountry.currency}`}</button>
                            }
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-4">
                        <div className="bg-[#141414] rounded-[20px] border border-white/10 p-6 sticky top-6">
                            <h3 className="font-bold text-sm mb-3">My Plans ({plans.length}) • {selectedCountry.name} - {template}</h3>
                            <div className="space-y-3 max-h-[60vh] overflow-auto">
                                {plans.map((p: any) => (
                                    <div key={p.id} className="bg-black border border-white/10 rounded-xl p-3 flex justify-between items-center">
                                        <div><div className="text-xs font-bold">{p.title}</div><div className="text-[10px] text-white/50">{p.template}</div></div>
                                        <button onClick={() => window.open(`${API_URL}/business-plans/file/${p.id}?token=${getToken()}`, "_blank")} className="bg-white text-black px-3 py-1 rounded-lg text-[11px] font-bold">View</button>
                                    </div>
                                ))}
                                {plans.length === 0 && <div className="text-[11px] text-white/30 text-center py-10 border border-dashed border-white/10 rounded-xl">No plans yet. Select country, it auto-detects {currencySymbol} currency. Works for any country worldwide.</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}