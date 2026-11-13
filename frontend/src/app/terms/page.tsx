export const dynamic = 'force-dynamic';
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | TMG Business Consulting",
  description: "Terms for using TMG Business Consulting website, AI tools, and services.",
};

export default function TermsPage() {
  return (
    <article className="mx-auto px-6 py-14" style={{ maxWidth: "var(--container-max)" }}>
      <div className="max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--gold)" }}>Legal</p>
        <h1 className="mt-3 font-bold tracking-tight" style={{ fontSize: "var(--h1-size)" }}>Terms of Service</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: 13 November 2026</p>

        <div className="mt-8 rounded-xl border p-5 text-sm leading-6" style={{ borderColor: "var(--border-color)", background: "var(--card-bg)" }}>
          <p className="font-semibold">TMG Business Consulting</p>
          <p className="mt-1 text-slate-600">Doha, Qatar â€¢ Email: <a href="mailto:info@tmgbusinessconsulting.com" className="font-semibold underline">info@tmgbusinessconsulting.com</a> â€¢ Phone / WhatsApp: <a href="https://wa.me/97470454450" className="font-semibold underline">+974 7045 4450</a></p>
          <p className="mt-1 text-slate-600">By using this website, you agree to these terms. If you do not agree, do not use the site.</p>
        </div>

        <h2 className="mt-10 text-xl font-bold">Services</h2>
        <p className="mt-3 leading-7 text-slate-700">TMG provides business consulting, training, AI tools, and digital templates. A quote request is an enquiry, not an accepted offer. Scope, deliverables, schedule, and fees are confirmed in writing before paid work begins.</p>

        <h2 className="mt-10 text-xl font-bold">Accounts and acceptable use</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-slate-700">
          <li>Provide accurate information and keep your credentials secure.</li>
          <li>Do not impersonate, attempt unauthorized access, or violate applicable law.</li>
          <li>Do not submit passwords, payment credentials, or confidential third-party information to AI tools.</li>
          <li>We may suspend access where reasonably necessary to protect users or legal rights.</li>
        </ul>

        <h2 className="mt-10 text-xl font-bold">AI-generated content</h2>
        <p className="mt-3 leading-7 text-slate-700">AI tools send submitted text to our AI provider and generate output automatically. Output may be incomplete or inaccurate. You must review it before relying on it. AI output is general information and drafting help only. It is not legal, tax, accounting, immigration, financial, or professional advice. No outcome is guaranteed.</p>

        <h2 className="mt-10 text-xl font-bold">Prices, payments, and delivery</h2>
        <p className="mt-3 leading-7 text-slate-700">Prices are shown on the <Link href="/pricing" className="font-semibold underline">Pricing page</Link> and at checkout. Checkout is processed by PayPal. Payment is recorded after our server verifies the PayPal capture. Digital templates are delivered by instant download after payment. Consulting services are delivered as agreed in writing.</p>
        <p className="mt-3 leading-7 text-slate-700">No recurring charge unless clearly presented at checkout as a subscription. You can cancel a subscription from your PayPal account or by contacting us before the next billing date.</p>

        <h2 className="mt-10 text-xl font-bold">Refund policy</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-slate-700">
          <li><strong>Digital templates and downloads:</strong> No refund after download, because the file cannot be returned.</li>
          <li><strong>Defective file:</strong> If the file is defective, corrupted, or not as described, contact us within 7 days of purchase at info@tmgbusinessconsulting.com. We will replace the file or refund you.</li>
          <li><strong>Consulting / services:</strong> Refunds are handled per the written agreement for that service. If work has not started, contact us to discuss cancellation.</li>
          <li><strong>How to request:</strong> Email info@tmgbusinessconsulting.com with your order ID, date, and reason. We respond within 3 business days.</li>
        </ul>

        <h2 className="mt-10 text-xl font-bold">Intellectual property</h2>
        <p className="mt-3 leading-7 text-slate-700">Website content and software are owned by or licensed to TMG. You retain rights in material you submit. You give us permission to process that material to operate the service, per our <Link href="/privacy" className="font-semibold underline">Privacy Policy</Link>. Purchased templates are licensed to you for your own business use. You may not resell or redistribute them.</p>

                <h2 className="mt-10 text-xl font-bold">Social login</h2>
        <p className="mt-3 leading-7 text-slate-700">You may sign in with Facebook, Google, Instagram, or TikTok. By using social login, you agree to that provider&apos;s terms. You are responsible for keeping your provider account secure. If you delete your TMG account, your provider account is not deleted - only your TMG data.</p>
        <h2 className="mt-10 text-xl font-bold">Third-party services</h2>
        <p className="mt-3 leading-7 text-slate-700">This site uses PayPal for payments, Groq for AI, Meta Platforms (Facebook / Instagram) for social login, Google for social login, and TikTok for social login. Those services are governed by their own terms and privacy policies.</p>

        <h2 className="mt-10 text-xl font-bold">Liability</h2>
        <p className="mt-3 leading-7 text-slate-700">To the extent permitted by law, the website is provided without guarantee of being uninterrupted or error-free. Nothing in these terms excludes liability that cannot legally be excluded.</p>

        <h2 className="mt-10 text-xl font-bold">Governing law</h2>
        <p className="mt-3 leading-7 text-slate-700">These terms are governed by the laws of the State of Qatar, without limiting mandatory protections where you live.</p>

        <h2 className="mt-10 text-xl font-bold">Contact</h2>
        <p className="mt-3 leading-7 text-slate-700">Questions about these terms? Email <a href="mailto:info@tmgbusinessconsulting.com" className="font-semibold underline">info@tmgbusinessconsulting.com</a> or <Link href="/contact" className="font-semibold underline">contact us</Link>.</p>
      </div>
    </article>
  );
}


