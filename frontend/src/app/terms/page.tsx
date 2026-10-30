import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use | TMG Business Consulting",
  description: "Terms for using the TMG Business Consulting website, AI tools, and services.",
  alternates: { canonical: "https://tmgbusinessconsulting.com/terms" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Terms of Use | TMG Business Consulting",
    description: "Terms for using TMG website, AI tools, and services.",
    url: "https://tmgbusinessconsulting.com/terms",
    type: "website",
    siteName: "TMG Business Consulting",
  },
};

const sectionClass = "mt-10 scroll-mt-24";
const headingClass = "text-xl font-bold tracking-tight";
const paragraphClass = "mt-3 leading-7 text-slate-700";
const listClass = "mt-3 list-disc space-y-2 pl-6 leading-7 text-slate-700";

export default function TermsPage() {
  return (
    <article className="mx-auto px-6 py-14" style={{ maxWidth: "var(--container-max)" }}>
      <div className="max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--gold)" }}>Legal</p>
        <h1 className="mt-3 font-bold tracking-tight" style={{ fontSize: "var(--h1-size)", fontFamily: "var(--font-family)" }}>Terms of Use and Service</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: 18 October 2026</p>

        <div className="mt-8 rounded-xl border p-5 text-sm leading-6" style={{ borderColor: "var(--border-color)", background: "var(--card-bg)", borderRadius: "var(--radius)" }}>
          <p className="font-semibold">TMG Business Consulting</p>
          <p className="mt-1 text-slate-600">For full registered legal name, address, and service-specific terms, please contact us. Scope, delivery, cancellation and refund terms are confirmed in writing before paid work begins.</p>
        </div>

        <nav aria-label="Table of contents" className="mt-8 border-l-2 pl-4" style={{ borderColor: "var(--border-color)" }}>
          <p className="text-sm font-semibold">On this page</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li><a href="#services" className="underline hover:no-underline" style={{ color: "var(--primary)" }}>Website and services</a></li>
            <li><a href="#acceptable-use" className="underline hover:no-underline" style={{ color: "var(--primary)" }}>Accounts and acceptable use</a></li>
            <li><a href="#ai" className="underline hover:no-underline" style={{ color: "var(--primary)" }}>AI-generated content</a></li>
            <li><a href="#payments" className="underline hover:no-underline" style={{ color: "var(--primary)" }}>Prices, payments, and delivery</a></li>
            <li><a href="#ip" className="underline hover:no-underline" style={{ color: "var(--primary)" }}>Intellectual property</a></li>
          </ul>
        </nav>

        <p className={paragraphClass}>
          These terms apply when you access the TMG Business Consulting website, use its tools, submit an enquiry, or purchase a service. By using the site, you agree to these terms. If you do not agree, do not use the site or its services.
        </p>

        <section id="services" className={sectionClass}>
          <h2 className={headingClass}>Website and services</h2>
          <p className={paragraphClass}>
            The site provides information about business consulting, training, and digital tools, and may allow you to request a quote or purchase a package. A quote request is an enquiry, not an accepted offer. Scope, deliverables, schedule, and fees are confirmed in writing before work begins.
          </p>
        </section>

        <section id="acceptable-use" className={sectionClass}>
          <h2 className={headingClass}>Accounts and acceptable use</h2>
          <ul className={listClass}>
            <li>Provide accurate information and keep credentials secure.</li>
            <li>Do not impersonate, attempt unauthorized access, or violate applicable law.</li>
            <li>Do not submit passwords, payment credentials, or confidential third-party info to AI tools.</li>
            <li>We may suspend access where reasonably necessary to protect users or legal rights.</li>
          </ul>
        </section>

        <section id="ai" className={sectionClass}>
          <h2 className={headingClass}>AI-generated content</h2>
          <p className={paragraphClass}>
            AI tools send submitted text to an external AI provider and generate output automatically. Output may be incomplete or inaccurate. You are responsible for reviewing it before relying on it.
          </p>
          <p className={paragraphClass}>
            AI output is for general information and drafting assistance only. It is not legal, tax, accounting, immigration, financial, or professional advice. No outcome is guaranteed.
          </p>
        </section>

        <section id="payments" className={sectionClass}>
          <h2 className={headingClass}>Prices, payments, and delivery</h2>
          <p className={paragraphClass}>
            Prices are shown on the <Link href="/pricing" className="font-semibold underline" style={{ color: "var(--primary)" }}>Pricing page</Link> and at checkout. Checkout is processed by PayPal. Payment is recorded after server verifies capture.
          </p>
          <p className={paragraphClass}>
            Confirm delivery date, access period, and fulfillment details in writing before paying. No recurring charge unless clearly presented at checkout.
          </p>
          <p className={paragraphClass}>
            Cancellation and refund requests via <Link href="/contact" className="font-semibold underline" style={{ color: "var(--primary)" }}>Contact page</Link>. Terms are disclosed for each purchase.
          </p>
        </section>

        <section id="ip" className={sectionClass}>
          <h2 className={headingClass}>Intellectual property and submitted material</h2>
          <p className={paragraphClass}>
            Website content and software are owned by or licensed to operator. You retain rights in material you submit. You give us permission to process that material as needed to operate service, per our <Link href="/privacy" className="font-semibold underline" style={{ color: "var(--primary)" }}>Privacy Notice</Link>.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>Third-party services</h2>
          <p className={paragraphClass}>
            Site relies on third-party services including PayPal and AI provider, governed by their own terms. We may update or suspend features while honoring legal obligations.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>Liability</h2>
          <p className={paragraphClass}>
            To the extent permitted by law, website is provided without guarantee of being uninterrupted or error-free. Nothing excludes liability or rights that cannot legally be excluded.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>Governing law and changes</h2>
          <p className={paragraphClass}>
            Governed by laws of State of Qatar, without limiting mandatory protections where you live. We may update terms by publishing revised version here.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>Contact</h2>
          <p className={paragraphClass}>
            Questions? Contact via <Link href="/contact" className="font-semibold underline" style={{ color: "var(--primary)" }}>Contact page</Link>.
          </p>
        </section>
      </div>
    </article>
  );
}

