import { UploadHubClient } from "@/components/upload-hub";

export const dynamic = "force-dynamic";

export default function UploadPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">Client portal</p>
      <h1 className="mt-2 text-3xl font-bold text-zinc-900">Upload Hub</h1>
      <p className="mt-2 text-sm text-slate-600">Upload project files (scanned, local disk), email instructions, or add YouTube/TikTok video links.</p>
      <div className="mt-8">
        <UploadHubClient />
      </div>
    </main>
  );
}
