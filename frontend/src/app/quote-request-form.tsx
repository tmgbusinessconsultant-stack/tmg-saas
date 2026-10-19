"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import TurnstileChallenge from "@/components/turnstile-challenge";

type QuoteRequestFormProps = {
  source: "booking" | "contact" | "quote";
};

const services = [
  { value: "company-formation", label: "Company Formation" },
  { value: "pro-services", label: "PRO and Document Clearing" },
  { value: "consulting", label: "Business Consulting" },
  { value: "ai-tools", label: "AI Consulting and Tools" },
  { value: "training", label: "Productivity Training" },
  { value: "other", label: "Other / Website Consulting" },
];

export default function QuoteRequestForm({ source }: QuoteRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [captchaRevision, setCaptchaRevision] = useState(0);
  const [companySize, setCompanySize] = useState("");
  const [employees, setEmployees] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setIsError(false);
    if (!turnstileToken) {
      setMessage("Complete the bot verification challenge before submitting.");
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
    if (!apiUrl) {
      setMessage("The enquiry service is not configured. Please contact us by email.");
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/quote-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          company: formData.get("company"),
          serviceType: formData.get("serviceType"),
          message: [
            formData.get("message"),
            companySize ? `Company size: ${companySize}` : "",
            employees ? `Employees: ${employees}` : "",
            formData.get("scope") ? `Project scope: ${formData.get("scope")}` : "",
            formData.get("budgetRange") ? `Budget range: ${formData.get("budgetRange")}` : "",
          ].filter(Boolean).join("\n\n"),
          source,
          turnstileToken,
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const errorMessage = typeof result === "object" && result !== null && "message" in result
          ? Array.isArray(result.message) ? result.message.join(" ") : result.message
          : "Could not send your request.";
        throw new Error(typeof errorMessage === "string" ? errorMessage : "Could not send your request.");
      }

      form.reset();
      setTurnstileToken("");
      setCompanySize("");
      setEmployees("");
      setMessage("Thanks, your request has been sent. We’ll be in touch shortly.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Could not send your request. Please try again.");
    } finally {
      setIsSubmitting(false);
      setTurnstileToken("");
      setCaptchaRevision((revision) => revision + 1);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4">
        <label className="block text-sm font-medium">
          Full name
          <input name="name" required maxLength={120} autoComplete="name" className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2" placeholder="Your name" />
        </label>
        <label className="block text-sm font-medium">
          Email
          <input name="email" type="email" required maxLength={160} autoComplete="email" className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2" placeholder="you@example.com" />
        </label>
        <label className="block text-sm font-medium">
          Phone <span className="font-normal text-slate-500">(optional)</span>
          <input name="phone" type="tel" maxLength={30} autoComplete="tel" className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2" placeholder="+974 ..." />
        </label>
        <label className="block text-sm font-medium">
          Company <span className="font-normal text-slate-500">(optional)</span>
          <input name="company" maxLength={120} autoComplete="organization" className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2" placeholder="Company name" />
        </label>
        <label className="block text-sm font-medium">
          Service
          <select name="serviceType" required defaultValue={source !== "contact" ? "consulting" : "other"} className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2">
            {services.map((service) => <option key={service.value} value={service.value}>{service.label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Project details
          <textarea name="message" required minLength={5} maxLength={3000} rows={5} className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2" placeholder="Tell us about your goals, timeline, and budget." />
        </label>
        {source !== "contact" && (
          <fieldset className="grid gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
            <legend className="px-1 text-sm font-semibold">Project context</legend>
            <label className="text-sm font-medium">Company size
              <select name="companySize" value={companySize} onChange={(event) => setCompanySize(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                <option value="">Select (optional)</option><option>Startup</option><option>Small business</option><option>Medium business</option><option>Large organization</option>
              </select>
            </label>
            <label className="text-sm font-medium">Employees
              <input name="employees" type="number" min={1} max={1000000} value={employees} onChange={(event) => setEmployees(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Optional" />
            </label>
            <label className="text-sm font-medium sm:col-span-2">Scope or deliverables
              <textarea name="scope" rows={3} maxLength={1200} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="What would you like the project to cover?" />
            </label>
            <label className="text-sm font-medium sm:col-span-2">Budget range
              <select name="budgetRange" defaultValue="" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                <option value="">Prefer not to say</option><option>Under $500</option><option>$500–$2,000</option><option>$2,000–$10,000</option><option>Over $10,000</option><option>To be discussed</option>
              </select>
            </label>
            <p className="text-xs leading-5 text-slate-500 sm:col-span-2">Preliminary numeric estimates are disabled until TMG approves service pricing. Your scope will be reviewed before a quote is issued.</p>
          </fieldset>
        )}
        <TurnstileChallenge key={captchaRevision} onToken={setTurnstileToken} />
        <button type="submit" disabled={isSubmitting || !turnstileToken} className="bg-[#D4AF37] text-black px-6 py-3 rounded-md font-bold disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? "Sending..." : source === "contact" ? "Send message" : "Request a quote"}
        </button>
        <p className="text-xs leading-5 text-slate-500">
          We use these details to respond to your enquiry. See our <Link href="/privacy" className="underline">Privacy Notice</Link> and <Link href="/terms" className="underline">Terms</Link>.
        </p>
        {message && <p role={isError ? "alert" : "status"} className={`text-sm ${isError ? "text-red-700" : "text-green-700"}`}>{message}</p>}
      </div>
    </form>
  );
}
