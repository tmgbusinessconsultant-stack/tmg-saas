import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Notice | TMG Business Consulting",
  description: "Learn how TMG Business Consulting collects, uses, and protects information submitted through this website.",
};

const sectionClass = "mt-10";
const headingClass = "text-[18px] font-semibold tracking-tight text-zinc-900";
const paragraphClass = "mt-3 leading-7 text-zinc-600";
const listClass = "mt-4 list-disc space-y-2.5 pl-6 leading-7 text-zinc-600";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FCFCF9]">
      <article className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        {/* Header - TMG Standard */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">Legal</p>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-zinc-900">
            Privacy Notice
          </h1>
          <p className="mt-3 text-sm text-zinc-500">Last updated: 19 October 2026</p>
        </div>

        {/* Premium Notice Card */}
        <div className="mt-8 rounded-[20px] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.06] p-5 md:p-6">
          <div className="flex gap-3">
            <div className="mt-0.5 h-6 w-6 rounded-full bg-[#D4AF37] text-zinc-900 grid place-items-center text-[11px] font-bold">!</div>
            <p className="text-sm leading-6 text-zinc-700">
              <span className="font-semibold text-zinc-900">TMG Business Consulting</span> is the name displayed on this website. Before public launch, the operator should publish its full registered legal name and business address and confirm this notice with qualified local counsel.
            </p>
          </div>
        </div>

        <p className={paragraphClass}>
          This notice explains how information is handled when you browse this website, contact us, create an account, use an AI tool, or make a purchase. “TMG”, “we”, and “us” refer to the operator of the TMG Business Consultant website and services.
        </p>

        <section className={sectionClass}>
          <h2 className={headingClass}>Information you provide</h2>
          <ul className={listClass}>
            <li>Quote and contact requests: name, email address, optional phone and company, selected service, and the project details you submit.</li>
            <li>Accounts: name, email address, and a password stored by the service as a bcrypt password hash rather than readable password text.</li>
            <li>Project delivery: project titles, service requests, instructions, project messages, and file names, types, sizes, versions, and the files you upload or receive as deliverables.</li>
            <li>AI tools: prompts, conversation messages, and generated responses. Anonymous AI conversations are retained for up to 90 days and may be reviewed by authorized administrators.</li>
            <li>Search: search terms and result counts are recorded for search analytics for up to 90 days. A short recent-search list is stored in your browser’s local storage.</li>
            <li>Purchases: PayPal order and capture identifiers, selected plan, amount, currency, status, and related timestamps. PayPal handles checkout and payment credentials; this application does not intentionally store your card or PayPal password.</li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>How we use information</h2>
          <ul className={listClass}>
            <li>Respond to enquiries and provide requested consulting, training, tools, or other services.</li>
            <li>Create and secure accounts, administer access, and respond to support requests.</li>
            <li>Store project files privately, scan them for malware before making them available for download, exchange deliverables, and maintain project communication and activity history.</li>
            <li>Send text submitted to an AI tool to our AI service provider, currently Groq, to generate a response. Do not submit confidential client material, passwords, payment details, government identifiers, or sensitive personal information unless you have authority and have assessed the risks.</li>
            <li>After an administrator confirms that the client authorized the processing, send the extracted text of a malware-scanned project file (up to 10 MB) to Groq for an AI-generated draft summary, insights, and recommendations. An administrator must review the result before it is relied on or shared.</li>
            <li>Use PayPal to create and verify checkout orders and record completed payments.</li>
            <li>Maintain service security, diagnose failures, and meet applicable legal, accounting, and record-keeping obligations.</li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>Service providers and international processing</h2>
          <p className={paragraphClass}>
            Information is handled by service providers needed to operate the site. These include Groq for AI generation, Cloudflare Turnstile for bot verification on public forms, PayPal for checkout, AWS S3 for private project and temporary knowledge-file storage, AWS GuardDuty Malware Protection for file scanning when configured, and the website, API, and database hosting providers selected by the operator. Approved knowledge-file text and, following the documented administrator confirmation, extracted text from project files may be sent to Groq. Original knowledge files are removed from S3 after successful indexing; extracted knowledge text is retained in the application database until an administrator deletes the entry. Provider terms and privacy notices apply. Providers may process information in countries other than Qatar. TMG should confirm hosting regions, provider terms, and appropriate transfer safeguards before launch.
          </p>
          <p className={paragraphClass}>
            We do not sell personal information. We may disclose information where necessary to provide a requested service, protect rights and security, or comply with applicable law.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>Retention and security</h2>
          <p className={paragraphClass}>
            AI conversations, search queries, and rate-limit records are automatically deleted after 90 days, 90 days, and 24 hours respectively. AI knowledge text remains until an administrator deletes it. Project files and AI file-analysis reports remain with their project until removed by an authorized administrator; this workflow does not yet provide a project recycle bin. Website enquiries and account records follow operational and applicable legal/accounting requirements. Payment records may need to be retained for financial and legal records.
          </p>
          <p className={paragraphClass}>
            We use measures intended to protect information, including hashed account passwords and restricted administrative access. No internet transmission or storage system can be guaranteed completely secure.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>Browser storage and third-party features</h2>
          <p className={paragraphClass}>
            The sign-in token is stored in session storage in the browser and is removed when you sign out or the browser session ends. A signed, HTTP-only AI session cookie is used for AI session-level rate limiting. Project file upload and download use short-lived AWS S3 signed URLs; do not share those URLs. Cloudflare Turnstile protects public forms. The pricing page loads PayPal’s checkout software when configured; PayPal may use cookies or similar technologies under its own privacy practices.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>Your choices and requests</h2>
          <p className={paragraphClass}>
            Depending on applicable law, you may be able to request access to, correction of, or deletion of personal information, or raise an objection or complaint. To make a privacy request, use the <Link href="/contact" className="font-medium text-zinc-900 underline decoration-[#D4AF37] underline-offset-4 hover:text-[#D4AF37] transition-colors">contact form</Link> and identify it as a privacy request. We may need to verify your identity and may retain some records where the law permits or requires it.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>Children</h2>
          <p className={paragraphClass}>
            The website and business services are intended for businesses and adults. They are not designed for children, and we do not knowingly seek to collect children’s personal information.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>Changes and contact</h2>
          <p className={paragraphClass}>
            We may update this notice as the services or applicable requirements change. The latest version will be published on this page with its update date. For questions, contact us through the <Link href="/contact" className="font-medium text-zinc-900 underline decoration-[#D4AF37] underline-offset-4 hover:text-[#D4AF37] transition-colors">Contact page</Link>.
          </p>
        </section>

        <div className="mt-16 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs text-zinc-500">
            Doha, Qatar • TMG Business Consulting
          </div>
        </div>
      </article>
    </div>
  );
}

