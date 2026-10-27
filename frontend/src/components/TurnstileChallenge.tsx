"use client";
export default function TurnstileChallenge({ onVerify }: { onVerify: (t: string)=>void }) {
  return <div className="text-xs text-slate-500">Captcha disabled in dev</div>;
}
