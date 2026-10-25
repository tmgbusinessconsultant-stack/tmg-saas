import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload a Project File | TMG",
  description: "Securely upload project documents through the TMG client portal.",
  alternates: { canonical: "https://tmgbusinessconsulting.com/upload" },
  robots: { index: false, follow: true, noarchive: true, nosnippet: true },
  openGraph: {
    title: "Upload a Project File | TMG",
    description: "Secure client portal for project documents.",
    url: "https://tmgbusinessconsulting.com/upload",
    type: "website",
    siteName: "TMG Business Consulting",
  },
};

export default function UploadPage() {
  return (
    <main className="mx-auto px-6 py-16" style={{ maxWidth: "var(--container-max)" }}>
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--gold)" }}>Client Portal</p>
        <h1 className="mt-3 font-bold tracking-tight" style={{ fontSize: "var(--h1-size)", fontFamily: "var(--font-family)", lineHeight: "1.1" }}>
          Upload a project file
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600" style={{ lineHeight: "var(--line-height)" }}>
          Project files are uploaded inside your private client workspace so they are associated with the right project and account.
        </p>

        <div className="mt-8 rounded-xl border p-5 text-sm leading-6" style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)", background: "var(--card-bg)", borderLeftWidth: "4px", borderLeftColor: "var(--gold)" }}>
          <p className="font-semibold">Secure upload required</p>
          <p className="mt-1 text-slate-600">Please sign in before uploading. Do not send confidential files through public forms or email. File-type and size limits are enforced in the portal.</p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard" className="inline-flex items-center justify-center font-semibold text-white transition hover:opacity-90" style={{ borderRadius: "var(--button-radius)", minHeight: "var(--button-height)", background: "var(--primary)", paddingLeft: "20px", paddingRight: "20px" }}>
            Open Client Portal
          </Link>
          <Link href="/login?next=%2Fdashboard" className="inline-flex items-center justify-center font-semibold border bg-white hover:bg-slate-50 transition" style={{ borderRadius: "var(--button-radius)", minHeight: "var(--button-height)", borderColor: "var(--border-color)", paddingLeft: "20px", paddingRight: "20px" }}>
            Sign in
          </Link>
        </div>

        <p className="mt-10 text-xs text-slate-500">
          Need help? <Link href="/contact" className="underline font-medium" style={{ color: "var(--primary)" }}>Contact support</Link> or <Link href="/quote" className="underline font-medium" style={{ color: "var(--primary)" }}>request a quote</Link>.
        </p>
      </div>
    </main>
  );
}