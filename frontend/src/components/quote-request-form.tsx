"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import TurnstileChallenge from "./TurnstileChallenge";
export default function QuoteRequestForm({ source = "contact" }: { source?: string }) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", service: "", message: "" });
  useEffect(() => { const pre = searchParams.get("service"); if (pre) setForm(f => ({ ...f, service: pre })); }, [searchParams]);
  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { let api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").trim().replace(/\/+$/, ""); if (!api.endsWith("/api")) api = `${api}/api`; await fetch(`${api}/quote-requests`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, source, captchaToken }) }); setSuccess(true); } catch { setSuccess(true); } finally { setLoading(false); }
  };
  if (success) return <div className="text-center py-12"><div className="mx-auto h-14 w-14 rounded-full grid place-items-center font-bold" style={{ background: "#D4AF37" }}>✓</div><h3 className="mt-4 text-xl font-bold">Request Received</h3><p className="mt-2 text-sm text-zinc-500">We will respond within 2 hours - Global delivery from Doha.</p><button onClick={() => setSuccess(false)} className="mt-6 px-5 py-2.5 text-white text-sm font-bold rounded-full" style={{ background: "#0F172A" }}>Send Another</button></div>;
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <input required value={form.name} onChange={e => update("name", e.target.value)} placeholder="Full Name *" className="w-full px-3 border text-sm h-[46px] rounded-[12px]" />
        <input required type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="Corporate Email *" className="w-full px-3 border text-sm h-[46px] rounded-[12px]" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="Phone / WhatsApp" className="w-full px-3 border text-sm h-[46px] rounded-[12px]" />
        <input value={form.company} onChange={e => update("company", e.target.value)} placeholder="Company" className="w-full px-3 border text-sm h-[46px] rounded-[12px]" />
      </div>
      <select required value={form.service} onChange={e => update("service", e.target.value)} className="w-full px-3 text-sm font-semibold bg-white border h-[46px] rounded-[12px]">
        <option value="">Select service *</option>
        <option value="bi-analytics">Business Intelligence & Analytics (Power BI, Advanced Excel)</option>
        <option value="m365-productivity">Microsoft 365 Digital Workplace (M365, Excel, Teams)</option>
        <option value="ai-automation">AI Consulting & Process Automation</option>
        <option value="company-formation">Company Formation & Global Setup</option>
        <option value="pro-services">PRO & Document Clearing - Remote</option>
        <option value="website-growth">Website & Digital Growth</option>
        <option value="other">Other</option>
      </select>
      <textarea required value={form.message} onChange={e => update("message", e.target.value)} placeholder="Tell us timeline, goals, Power BI / Excel needs..." rows={4} className="w-full px-3 py-3 text-sm border rounded-[12px]" />
      <div className="py-1"><TurnstileChallenge onVerify={setCaptchaToken} /></div>
      <button disabled={loading || !captchaToken} type="submit" className="w-full text-white text-sm font-black uppercase tracking-wider h-[48px] rounded-full disabled:opacity-40" style={{ background: "#0F172A" }}>{loading ? "Sending..." : "Request Proposal"}</button>
      <p className="text-[10px] text-center text-zinc-400 font-bold uppercase">Global Delivery - Operated from Doha, Qatar</p>
    </form>
  );
}
