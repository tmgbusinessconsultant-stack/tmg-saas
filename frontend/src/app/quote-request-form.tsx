"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import TurnstileChallenge from "@/components/turnstile-challenge";

type Props = { source: "booking" | "contact" | "quote" };

const SERVICES = [
  { value: "company-formation", label: "Company Formation" },
  { value: "pro-services", label: "PRO and Document Clearing" },
  { value: "consulting", label: "Business Consulting" },
  { value: "ai-tools", label: "AI Consulting and Tools" },
  { value: "training", label: "Productivity Training" },
  { value: "other", label: "Other / Website Consulting" },
] as const;

export default function QuoteRequestForm({ source }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [revision, setRevision] = useState(0);
  const [companySize, setCompanySize] = useState("");
  const [employees, setEmployees] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage("");
    setIsError(false);

    if (!turnstileToken) {
      setMessage("Complete the bot verification.");
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim().toLowerCase(),
      phone: String(fd.get("phone") || "").trim(),
      company: String(fd.get("company") || "").trim(),
      serviceType: String(fd.get("serviceType") || "").trim(),
      message: String(fd.get("message") || "").trim(),
      companySize: companySize.trim(),
      employees: employees ? Number(employees) : undefined,
      scope: String(fd.get("scope") || "").trim(),
      budgetRange: String(fd.get("budgetRange") || "").trim(),
      source,
      turnstileToken,
    };

    if (payload.employees && (payload.employees < 1 || payload.employees > 1_000_000)) {
      setMessage("Employees must be 1 - 1,000,000.");
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/quote-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string | string[] };
      if (!res.ok) {
        const raw = data.message;
        throw new Error(Array.isArray(raw) ? raw.join(" ") : raw || "Could not send request.");
      }
      (e.target as HTMLFormElement).reset();
      setCompanySize("");
      setEmployees("");
      setMessage("Thanks, your request has been sent. We'll be in touch within 24h.");
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Could not send request.");
    } finally {
      setIsSubmitting(false);
      setTurnstileToken("");
      setRevision(r => r + 1);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border bg-white p-6 shadow-sm" style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)", background: "var(--card-bg)" }}>
      <div className="grid gap-4">
        <label className="block text-sm font-medium">Full name
          <input name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder="Your name" className="mt-1 w-full border px-3 py-2.5 outline-none focus:ring-2" style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)" }} />
        </label>
        <label className="block text-sm font-medium">Email
          <input name="email" type="email" required maxLength={160} autoComplete="email" placeholder="you@example.com" className="mt-1 w-full border px-3 py-2.5 outline-none focus:ring-2" style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)" }} />
        </label>
        <label className="block text-sm font-medium">Phone <span className="font-normal text-slate-500">(optional)</span>
          <input name="phone" type="tel" maxLength={30} autoComplete="tel" placeholder="+974 ..." className="mt-1 w-full border px-3 py-2.5 outline-none focus:ring-2" style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)" }} />
        </label>
        <label className="block text-sm font-medium">Company <span className="font-normal text-slate-500">(optional)</span>
          <input name="company" maxLength={120} autoComplete="organization" placeholder="Company name" className="mt-1 w-full border px-3 py-2.5 outline-none focus:ring-2" style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)" }} />
        </label>
        <label className="block text-sm font-medium">Service
          <select name="serviceType" required defaultValue={source !== "contact" ? "consulting" : "other"} className="mt-1 w-full border px-3 py-2.5" style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)" }}>
            {SERVICES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">Project details
          <textarea name="message" required minLength={10} maxLength={3000} rows={5} placeholder="Goals, timeline, budget..." className="mt-1 w-full border px-3 py-2.5 outline-none focus:ring-2" style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)" }} />
        </label>

        {source !== "contact" && (
          <fieldset className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2" style={{ borderColor: "var(--border-color)", borderRadius: "var(--radius)" }}>
            <legend className="px-2 text-sm font-semibold">Project context</legend>
            <label className="text-sm font-medium">Company size
              <select value={companySize} onChange={e => setCompanySize(e.target.value)} className="mt-1 w-full border px-3 py-2.5" style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)" }}>
                <option value="">Select (optional)</option><option>Startup</option><option>Small business</option><option>Medium</option><option>Large</option>
              </select>
            </label>
            <label className="text-sm font-medium">Employees
              <input inputMode="numeric" pattern="[0-9]*" value={employees} onChange={e => setEmployees(e.target.value.replace(/\D/g, ""))} placeholder="Optional" className="mt-1 w-full border px-3 py-2.5" style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)" }} />
            </label>
            <label className="text-sm font-medium sm:col-span-2">Scope
              <textarea name="scope" rows={3} maxLength={1200} placeholder="What should project cover?" className="mt-1 w-full border px-3 py-2.5" style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)" }} />
            </label>
            <label className="text-sm font-medium sm:col-span-2">Budget range
              <select name="budgetRange" defaultValue="" className="mt-1 w-full border px-3 py-2.5" style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)" }}>
                <option value="">Prefer not to say</option><option>Under $500</option><option>$500–$2,000</option><option>$2,000–$10,000</option><option>Over $10,000</option><option>To be discussed</option>
              </select>
            </label>
          </fieldset>
        )}

        <TurnstileChallenge key={revision} onToken={setTurnstileToken} />
        <button type="submit" disabled={isSubmitting || !turnstileToken} className="w-full font-bold text-black transition disabled:opacity-60" style={{ borderRadius: "var(--button-radius)", minHeight: "var(--button-height)", background: "var(--gold)" }}>
          {isSubmitting ? "Sending..." : source === "contact" ? "Send message" : "Request a quote"}
        </button>
        <p className="text-xs text-slate-500">See our <Link href="/privacy" className="underline" style={{ color: "var(--primary)" }}>Privacy</Link> and <Link href="/terms" className="underline" style={{ color: "var(--primary)" }}>Terms</Link>.</p>
        {message && <p role={isError ? "alert" : "status"} aria-live="polite" className={`rounded-lg border p-3 text-sm ${isError ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}>{message}</p>}
      </div>
    </form>
  );
}