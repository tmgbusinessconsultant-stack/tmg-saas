"use client";
import { Turnstile } from "@marsidev/react-turnstile";

export default function TurnstileChallenge({ onVerify }: { onVerify: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (!siteKey) {
    return <p role="alert" className="text-sm text-red-700">Bot verification is not configured.</p>;
  }
  return <Turnstile siteKey={siteKey} onSuccess={onVerify} />;
}
