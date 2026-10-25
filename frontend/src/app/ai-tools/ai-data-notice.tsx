import Link from "next/link";

export default function AiDataNotice() {
  return (
    <div className="mt-6 flex items-start gap-2.5 rounded-[12px] border border-zinc-100 bg-zinc-50 px-3.5 py-3">
      <span className="mt-[2px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4AF37]" />
      <p className="text-[11px] leading-[1.6] text-zinc-500">
        Your text is sent to our AI provider (Groq) for generation. Requests are retained up to 90 days for quality. Do not include confidential or sensitive data. See{" "}
        <Link href="/privacy" className="font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900">Privacy</Link>
        {" and "}
        <Link href="/terms" className="font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900">Terms</Link>.
      </p>
    </div>
  );
}