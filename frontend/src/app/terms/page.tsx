import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms for using the TMG Business Consultant website, AI tools, and services.",
};

const sectionClass = "mt-8";
const headingClass = "text-xl font-semibold";
const paragraphClass = "mt-3 leading-7 text-slate-700";
const listClass = "mt-3 list-disc space-y-2 pl-6 leading-7 text-slate-700";

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-4xl px-6 py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Legal</p>
      <h1 className="mt-3 text-4xl font-bold">Terms of Use and Service</h1>
      <p className="mt-3 text-sm text-slate-500">Last updated: 18 October 2026</p>

      <div className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
        TMG Business Consulting is the name displayed on this website. Before accepting paid orders, the operator should publish its full registered legal name and business address and confirm the service scope, delivery, cancellation, and refund terms with qualified local counsel.
      </div>

      <p className={paragraphClass}>
        These terms apply when you access the TMG Business Consulting website, use its tools, submit an enquiry, or purchase a service. By using the site, you agree to these terms. If you do not agree, do not use the site or its services.
      </p>

      <section className={sectionClass}>
        <h2 className={headingClass}>Website and services</h2>
        <p className={paragraphClass}>
          The site provides information about business consulting, training, and digital tools, and may allow you to request a quote or purchase a package. A quote request is an enquiry, not an accepted offer or guarantee that a service is available. The scope, deliverables, schedule, and any additional fees for bespoke work should be confirmed in writing before that work begins.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Accounts and acceptable use</h2>
        <ul className={listClass}>
          <li>Provide accurate information and keep your account credentials secure.</li>
          <li>Do not impersonate another person, attempt unauthorized access, interfere with the service, or use the site in violation of applicable law or another person’s rights.</li>
          <li>Only submit information and materials you are authorized to use. Do not submit passwords, payment credentials, or confidential third-party information to AI tools.</li>
          <li>We may suspend access where reasonably necessary to protect users, the service, or legal rights.</li>
        </ul>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>AI-generated content</h2>
        <p className={paragraphClass}>
          AI tools send submitted text to an external AI provider and generate output automatically. Output may be incomplete, inaccurate, out of date, or unsuitable for your circumstances. You are responsible for reviewing and verifying it before relying on or sharing it.
        </p>
        <p className={paragraphClass}>
          AI output is for general informational and drafting assistance only. It is not legal, tax, accounting, immigration, financial, regulatory, or other professional advice, and it does not replace advice from a qualified professional or confirmation from the relevant Qatar or other authority. No outcome or business result is guaranteed.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Prices, payments, and delivery</h2>
        <p className={paragraphClass}>
          Prices and package descriptions are shown on the <Link href="/pricing" className="font-medium text-[#0F172A] underline">Pricing page</Link> and at checkout. Checkout is processed by PayPal, subject to PayPal’s terms. A payment is recorded after the server verifies the PayPal capture.
        </p>
        <p className={paragraphClass}>
          The current checkout describes one-time package purchases. Before paying, confirm with us in writing any delivery date, access period, human consulting time, or other fulfillment detail that is important to your purchase and not expressly stated in the package description. No recurring charge is intended unless it is clearly presented and accepted at checkout.
        </p>
        <p className={paragraphClass}>
          Cancellation and refund requests can be submitted through the <Link href="/contact" className="font-medium text-[#0F172A] underline">Contact page</Link>. They are assessed under the terms disclosed for the specific purchase and applicable law. This website does not currently display a detailed package-specific cancellation or refund schedule; ask us to confirm those terms before purchasing. Nothing in these terms limits rights that cannot legally be excluded.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Intellectual property and submitted material</h2>
        <p className={paragraphClass}>
          The website’s content, branding, and software are owned by or licensed to the operator and may not be copied or commercially reused without permission, except where permitted by law. You retain rights you already have in material you submit. You give us permission to process that material only as needed to operate the requested service, as described in our <Link href="/privacy" className="font-medium text-[#0F172A] underline">Privacy Notice</Link>.
        </p>
        <p className={paragraphClass}>
          AI-generated output may not be unique and may require substantial review or editing. Rights in bespoke deliverables, templates, and AI output should be confirmed in the written proposal or purchase terms for the relevant service.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Third-party services and availability</h2>
        <p className={paragraphClass}>
          The site relies on third-party services, including PayPal and an AI provider. Their services are governed by their own terms and may be unavailable or change. We do not control third-party services. We may update, suspend, or discontinue site features, while honoring applicable legal obligations and confirmed service commitments.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Liability</h2>
        <p className={paragraphClass}>
          To the extent permitted by applicable law, the website and general information are provided without a guarantee that they will be uninterrupted, error-free, or suitable for a particular purpose. Nothing in these terms excludes liability or consumer rights that cannot legally be excluded. Any limitation of liability for a specific paid service must be consistent with applicable law and the written terms for that service.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Governing law and changes</h2>
        <p className={paragraphClass}>
          These terms are intended to be governed by the laws of the State of Qatar, without limiting any mandatory protections that apply where you live. Courts with jurisdiction in Qatar will hear disputes, subject to any mandatory legal rights or forum rules. We may update these terms by publishing a revised version here; changes apply from the stated update date and do not retrospectively alter a confirmed purchase where prohibited by law.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Contact</h2>
        <p className={paragraphClass}>
          Questions about these terms or a purchase can be sent through our <Link href="/contact" className="font-medium text-[#0F172A] underline">Contact page</Link>.
        </p>
      </section>
    </article>
  );
}
