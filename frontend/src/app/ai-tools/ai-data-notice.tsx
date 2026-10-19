import Link from "next/link";

export default function AiDataNotice() {
  return (
    <p className="mt-4 text-xs leading-5 text-slate-500">
      When you submit text, it is sent to our AI provider, currently Groq, and the question/response is retained for up to 90 days for service quality. Do not include confidential or sensitive information. See our{" "}
      <Link href="/privacy" className="underline">Privacy Notice</Link> and{" "}
      <Link href="/terms" className="underline">Terms</Link>.
    </p>
  );
}
