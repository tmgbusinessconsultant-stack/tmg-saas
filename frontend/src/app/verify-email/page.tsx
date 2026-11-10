"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";

function VerifyInner() {
  const token = useSearchParams().get("token") || "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "Verifying your email…" : "Missing verification token.");

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Verification failed.");
        setStatus("ok");
        setMessage(data.message || "Email verified successfully.");
      } catch (e) {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Verification failed.");
      }
    })();
  }, [token]);

  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="text-3xl font-bold">Email verification</h1>
      <p className={`mt-4 rounded-lg border p-4 text-sm ${status === "ok" ? "bg-green-50 border-green-200 text-green-800" : status === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-200 text-slate-700"}`}>{message}</p>
      <div className="mt-6">
        <Link href={status === "ok" ? "/login?verified=1" : "/login"} className="inline-block rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white">Go to sign in</Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<div className="px-6 py-20 text-center">Loading…</div>}><VerifyInner /></Suspense>;
}
