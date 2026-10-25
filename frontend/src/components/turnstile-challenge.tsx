"use client";

import { useEffect, useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

type Props = {
  onToken: (token: string) => void;
  action?: string; // allow reuse for login, contact, quote
  theme?: "light" | "dark" | "auto";
};

export default function TurnstileChallenge({ onToken, action = "quote_submit", theme = "auto" }: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const ref = useRef<TurnstileInstance | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "expired">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-detect theme from CSS variable if auto
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    if (theme !== "auto") {
      setResolvedTheme(theme);
      return;
    }
    // Check if page is dark based on --background or prefers-color-scheme
    try {
      const bg = getComputedStyle(document.documentElement).getPropertyValue("--background") || "#F8FAFC";
      // simple check: if bg is dark
      const isDark = bg.trim().toLowerCase().includes("#0f172a") || window.matchMedia("(prefers-color-scheme: dark)").matches;
      setResolvedTheme(isDark ? "dark" : "light");
    } catch {
      setResolvedTheme("light");
    }
  }, [theme]);

  if (!siteKey) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
        <p className="font-semibold">Bot protection not configured</p>
        <p className="mt-1 text-xs opacity-80">NEXT_PUBLIC_TURNSTILE_SITE_KEY missing. Form will work but without captcha. Contact admin.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Turnstile
        ref={(instance) => {
          ref.current = instance;
        }}
        siteKey={siteKey}
        options={{
          action,
          theme: resolvedTheme,
          size: "normal", // responsive: use "compact" on mobile if needed
          language: "en",
          appearance: "always", // or "interaction-only" to reduce friction
          refreshExpired: "auto",
          refreshTimeout: "auto",
          retry: "auto",
          retryInterval: 8000,
        }}
        onLoad={() => {
          setStatus("ready");
          setErrorMsg("");
        }}
        onSuccess={(token) => {
          setStatus("ready");
          setErrorMsg("");
          onToken(token);
        }}
        onExpire={() => {
          setStatus("expired");
          onToken("");
          ref.current?.reset();
        }}
        onError={(code) => {
          setStatus("error");
          setErrorMsg(`Challenge failed (${code}). Retrying...`);
          onToken("");
          // Auto retry after 2s
          setTimeout(() => {
            ref.current?.reset();
            setStatus("loading");
          }, 2000);
        }}
        onBeforeInteractive={() => setStatus("loading")}
      />

      {/* Status UI */}
      {status === "loading" && (
        <p className="mt-2 text-xs text-slate-500 animate-pulse">Loading security check…</p>
      )}
      {status === "expired" && (
        <div className="mt-2 flex items-center gap-2">
          <p className="text-xs text-amber-700">Challenge expired — refresh required</p>
          <button type="button" onClick={() => { ref.current?.reset(); setStatus("loading"); }} className="text-xs underline font-semibold">Retry</button>
        </div>
      )}
      {status === "error" && (
        <div className="mt-2 flex items-center gap-2">
          <p className="text-xs text-red-600">{errorMsg || "Security check failed"}</p>
          <button type="button" onClick={() => { ref.current?.reset(); setStatus("loading"); setErrorMsg(""); }} className="text-xs border px-2 py-1 rounded bg-white hover:bg-slate-50">Retry now</button>
        </div>
      )}

      {/* NoScript fallback info */}
      <noscript>
        <p className="mt-2 text-xs text-red-600">Please enable JavaScript to complete the security check.</p>
      </noscript>
    </div>
  );
}
