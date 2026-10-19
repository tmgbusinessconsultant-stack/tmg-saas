"use client";

import { Turnstile } from "@marsidev/react-turnstile";

export default function TurnstileChallenge({ onToken }: { onToken: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (!siteKey) {
    return <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900" role="alert">Bot protection is not configured. Please contact TMG directly.</p>;
  }
  return (
    <Turnstile
      siteKey={siteKey}
      onSuccess={onToken}
      onExpire={() => onToken("")}
      onError={() => onToken("")}
    />
  );
}
