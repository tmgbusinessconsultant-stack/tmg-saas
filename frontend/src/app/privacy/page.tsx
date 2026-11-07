import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | TMG Business Consulting",
  description: "How TMG Business Consulting collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FCFCF9]">
      <article className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">Legal</p>
        <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-zinc-900">Privacy Policy</h1>
        <p className="mt-3 text-sm text-zinc-500">Last updated: 7 November 2026</p>

        <div className="mt-8 rounded-[20px] border border-zinc-200 bg-white p-5 md:p-6 text-sm leading-6">
          <p className="font-bold text-zinc-900">TMG Business Consulting</p>
          <p className="mt-2 text-zinc-600">Operated by TMG Business Consulting, Doha, Qatar.</p>
          <p className="mt-1 text-zinc-600">Email: <a href="mailto:hello.tmgbusinessconsulting@gmail.com" className="font-semibold underline">hello.tmgbusinessconsulting@gmail.com</a></p>
          <p className="mt-1 text-zinc-600">Phone / WhatsApp: <a href="https://wa.me/97470454450" className="font-semibold underline">+974 7045 4450</a></p>
          <p className="mt-1 text-zinc-600">For privacy requests, contact us by email with subject: Privacy Request.</p>
        </div>

        <p className="mt-8 leading-7 text-zinc-600">This policy explains how TMG Business Consulting (&quot;TMG&quot;, &quot;we&quot;, &quot;us&quot;) handles information when you browse this website, contact us, create an account, use an AI tool, or make a purchase.</p>

        <h2 className="mt-10 text-[18px] font-semibold text-zinc-900">Information you provide</h2>
        <ul className="mt-4 list-disc space-y-2.5 pl-6 leading-7 text-zinc-600">
          <li>Quote and contact requests: name, email, optional phone and company, selected service, and project details you submit.</li>
          <li>Accounts: name, email, and password stored as a bcrypt password hash, not readable password text.</li>
          <li>Project delivery: project titles, messages, file names, types, sizes, and files you upload or receive.</li>
          <li>AI tools: prompts, messages, and generated responses. Anonymous AI conversations are retained up to 90 days.</li>
          <li>Purchases: PayPal order and capture IDs, selected plan, amount, currency, status, and timestamps. PayPal handles checkout and payment credentials. We do not store your card number or PayPal password.</li>
        </ul>

        <h2 className="mt-10 text-[18px] font-semibold text-zinc-900">How we use information</h2>
        <ul className="mt-4 list-disc space-y-2.5 pl-6 leading-7 text-zinc-600">
          <li>Respond to enquiries and provide consulting, training, tools, or other services you request.</li>
          <li>Create and secure accounts, administer access, and respond to support requests.</li>
          <li>Store project files privately, scan them for malware before download, and maintain project history.</li>
          <li>Send text you submit to our AI provider, Groq, to generate a response. Do not submit passwords, payment details, government IDs, or sensitive personal information.</li>
          <li>Use PayPal to create and verify checkout orders and record completed payments.</li>
          <li>Maintain security, diagnose failures, and meet legal, accounting, and record-keeping obligations.</li>
        </ul>

        <h2 className="mt-10 text-[18px] font-semibold text-zinc-900">Service providers</h2>
        <p className="mt-3 leading-7 text-zinc-600">We use providers to operate this site: Groq for AI generation, Cloudflare Turnstile for bot verification, PayPal for checkout, AWS S3 for private file storage, and hosting/database providers. Providers may process information outside Qatar under their own terms. We do not sell your personal information.</p>

        <h2 className="mt-10 text-[18px] font-semibold text-zinc-900">Cookies and browser storage</h2>
        <p className="mt-3 leading-7 text-zinc-600">Sign-in token is stored in session storage and removed on sign-out. A signed, HTTP-only cookie is used for AI rate limiting. PayPal may use cookies on checkout pages under PayPal&apos;s own privacy policy. Project downloads use short-lived signed URLs - do not share them.</p>

        <h2 className="mt-10 text-[18px] font-semibold text-zinc-900">Retention and security</h2>
        <p className="mt-3 leading-7 text-zinc-600">AI conversations and search queries are deleted after 90 days. Payment records are retained for financial and legal records. We use hashed passwords and restricted admin access. No internet system can be guaranteed 100% secure.</p>

        <h2 className="mt-10 text-[18px] font-semibold text-zinc-900">Your rights</h2>
        <p className="mt-3 leading-7 text-zinc-600">You may request access, correction, or deletion of your personal information. Email <a href="mailto:hello.tmgbusinessconsulting@gmail.com" className="font-medium underline">hello.tmgbusinessconsulting@gmail.com</a> with subject &quot;Privacy Request&quot;. We may need to verify your identity and may retain some records where the law requires it.</p>

        <h2 className="mt-10 text-[18px] font-semibold text-zinc-900">Children</h2>
        <p className="mt-3 leading-7 text-zinc-600">Our services are for businesses and adults. We do not knowingly collect children&apos;s personal information.</p>

        <h2 className="mt-10 text-[18px] font-semibold text-zinc-900">Changes</h2>
        <p className="mt-3 leading-7 text-zinc-600">We may update this policy as services change. The latest version will be published on this page with its update date. Questions? <Link href="/contact" className="font-medium underline">Contact us</Link>.</p>

        <div className="mt-16 flex justify-center"><div className="rounded-full border px-4 py-2 text-xs text-zinc-500">Doha, Qatar • TMG Business Consulting • hello.tmgbusinessconsulting@gmail.com</div></div>
      </article>
    </div>
  );
}
