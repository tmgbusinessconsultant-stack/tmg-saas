"use client";

import { useRef } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

export default function TurnstileChallenge({ onToken }: { onToken: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const ref = useRef<TurnstileInstance | null>(null);

  if (!siteKey) {
    return <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900" role="alert">Bot protection is not configured. Please contact TMG directly.</p>;
  }

  return (
    <Turnstile
      ref={ref}
      siteKey={siteKey}
      options={{
        action: "quote_submit",
        theme: "light",
      }}
      onSuccess={(token) => onToken(token)}
      onExpire={() => {
        ref.current?.reset();
        onToken("");
      }}
      onError={() => {
        ref.current?.reset();
        onToken("");
      }}
    />
  );
}