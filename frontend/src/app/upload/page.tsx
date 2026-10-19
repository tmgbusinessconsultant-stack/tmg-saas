import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload a Project File",
  description: "Securely upload project documents through the TMG client portal.",
  alternates: { canonical: "/upload" },
  robots: { index: false, follow: true },
};

export default function UploadPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Client Portal</p>
      <h1 className="mt-3 text-4xl font-bold">Upload a project file</h1>
      <p className="mt-5 text-lg leading-8 text-slate-600">
        Project files are uploaded inside your private client workspace so they are associated with the right project and account.
      </p>
      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
        Please sign in before uploading. Do not send confidential files through public forms or email. Project upload size and file-type limits are enforced in the portal.
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dashboard" className="rounded-lg bg-[#0F172A] px-5 py-3 font-semibold text-white">Open Client Portal</Link>
        <Link href="/login?next=%2Fdashboard" className="rounded-lg border border-slate-300 px-5 py-3 font-semibold">Sign in</Link>
      </div>
    </main>
  );
}
