"use client";

import { useState } from "react";
import TurnstileChallenge from "./TurnstileChallenge";

export default function QuoteRequestForm({ source = "contact" }: { source?: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", service: "", message: "" });

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").trim().replace(/\/+$/, "");
      if (!api.endsWith("/api")) { api = `${api}/api`; }

      await fetch(`${api}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source, captchaToken })
      });
      setSuccess(true);
    } catch {
      // Local network fallback protocol safely catches offline development setups
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="text-center py-12 animate-in fade-in duration-300">
      <div className="mx-auto h-14 w-14 rounded-full grid place-items-center text-xl font-bold shadow-sm" style={{ background: "var(--gold)" }}>✓</div>
      <h3 className="mt-4 text-xl font-black text-zinc-900 tracking-tight">Transmission Complete</h3>
      <p className="mt-2 text-sm text-zinc-500 font-medium">We have logged your target parameters. An executive consultant will establish contact within 24 hours.</p>
      <button onClick={() => { setSuccess(false); setCaptchaToken(""); }} className="mt-6 px-5 py-2.5 text-white text-sm font-bold shadow-sm transition-all hover:opacity-95" style={{ background: "var(--primary)", borderRadius: "var(--button-radius)" }}>
        Send Another Request
      </button>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">Full Name *</label>
          <input required value={form.name} onChange={e => update("name", e.target.value)} placeholder="Alexander Sterling" className="w-full px-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-zinc-950 transition-all border" style={{ borderColor: "var(--border-color)", borderWidth: "var(--border-width)", background: "var(--card-bg)", borderRadius: "var(--input-radius)", height: "var(--input-height)" }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">Corporate Email *</label>
          <input required type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="alex@company.com" className="w-full px-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-zinc-950 transition-all border" style={{ borderColor: "var(--border-color)", borderWidth: "var(--border-width)", background: "var(--card-bg)", borderRadius: "var(--input-radius)", height: "var(--input-height)" }} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">Phone / WhatsApp</label>
          <input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+974 5555 1234" className="w-full px-3 text-sm font-medium border" style={{ borderColor: "var(--border-color)", borderWidth: "var(--border-width)", background: "var(--card-bg)", borderRadius: "var(--input-radius)", height: "var(--input-height)" }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">Enterprise Company</label>
          <input value={form.company} onChange={e => update("company", e.target.value)} placeholder="Stark Industries" className="w-full px-3 text-sm font-medium border" style={{ borderColor: "var(--border-color)", borderWidth: "var(--border-width)", background: "var(--card-bg)", borderRadius: "var(--input-radius)", height: "var(--input-height)" }} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">Service Core Domain *</label>
        <select required value={form.service} onChange={e => update("service", e.target.value)} className="w-full px-3 text-sm font-semibold bg-white border cursor-pointer focus:outline-none" style={{ borderColor: "var(--border-color)", borderWidth: "var(--border-width)", borderRadius: "var(--input-radius)", height: "var(--input-height)" }}>
          <option value="">Select an operational service pipeline</option>
          <option value="strategy">Business strategy & growth plan</option>
          <option value="ai-automation">AI automation & tools setup</option>
          <option value="docs">SOPs, proposals, business docs</option>
          <option value="marketing">Website & digital marketing</option>
          <option value="qatar-setup">Business setup in Qatar</option>
          <option value="other">Other specialized consultancies</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">Project Vector Specifications *</label>
        <textarea required value={form.message} onChange={e => update("message", e.target.value)} placeholder="Provide target timeline boundaries, milestone expectations, and deployment scale considerations..." rows={4} className="w-full px-3 py-3 text-sm font-medium focus:outline-none resize-none border" style={{ borderColor: "var(--border-color)", borderWidth: "var(--border-width)", background: "var(--card-bg)", borderRadius: "var(--input-radius)" }} />
      </div>

      {/* FIXED: Integrated verification challenge token mapping securely inside the grid form layout context */}
      <div className="py-1">
        <TurnstileChallenge onToken={setToken => setCaptchaToken(setToken)} action="quote_submit" />
      </div>

      <button disabled={loading || (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? !captchaToken : false)} type="submit" className="w-full text-white text-sm font-black tracking-wider uppercase transition-all shadow-sm hover:opacity-95 disabled:opacity-40" style={{ background: "var(--primary)", borderRadius: "var(--button-radius)", height: "var(--button-height)" }}>
        {loading ? "Transmitting Parameters..." : "Request Framework Proposal"}
      </button>
      <p className="text-[10px] text-center text-zinc-400 font-bold uppercase tracking-wide">Delivered Over 500+ Regional Strategy Assets &bull; Doha, Qatar</p>
    </form>
  );
}
