import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Data Deletion | TMG Business Consulting",
  description: "Request deletion of your TMG data, including Facebook-linked data.",
};

export default function DataDeletionPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 md:py-24">
      <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">Legal</p>
      <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-zinc-900">Data Deletion Request</h1>
      <p className="mt-3 text-sm text-zinc-500">Last updated: 13 November 2026</p>
      <div className="mt-8 rounded-[20px] border border-zinc-200 bg-white p-5 md:p-6 text-sm leading-6 text-zinc-600">
        <p className="font-bold text-zinc-900">TMG Business Consulting</p>
        <p className="mt-2">If you signed up with Facebook, Google, Instagram, or TikTok and want your TMG data deleted, follow the steps below.</p>
        <h2 className="mt-8 text-[18px] font-semibold text-zinc-900">Option 1: Email us (fastest)</h2>
        <p className="mt-3">Email <a className="font-semibold underline" href="mailto:info@tmgbusinessconsulting.com?subject=Facebook%20Data%20Deletion">info@tmgbusinessconsulting.com</a> from the email on your TMG account with subject <strong>Facebook Data Deletion</strong>.</p>
        <h2 className="mt-8 text-[18px] font-semibold text-zinc-900">Option 2: Remove TMG from Facebook</h2>
        <p className="mt-3">Go to Facebook: Settings &gt; Apps and Websites &gt; TMG Business Consulting &gt; Remove. Then email us so we can delete your TMG account data.</p>
        <h2 className="mt-8 text-[18px] font-semibold text-zinc-900">What we delete</h2>
        <ul className="mt-3 list-disc pl-5 space-y-2">
          <li>Your TMG account, profile name, email, and profile picture URL</li>
          <li>Your Facebook / Google / Instagram / TikTok linked identifier</li>
          <li>Your projects and uploaded files linked to that account</li>
        </ul>
        <p className="mt-3">We delete this within 30 days and confirm by email. Deleting your TMG account does NOT delete your Facebook, Google, Instagram, or TikTok account.</p>
        <p className="mt-8"><Link href="/privacy" className="font-semibold underline">Back to Privacy Policy</Link> | <Link href="/terms" className="font-semibold underline">Terms of Service</Link></p>
      </div>
    </main>
  );
}
