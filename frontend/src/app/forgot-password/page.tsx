"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Request failed.");
      setMessage(data.message || "If an account exists for this email, a password reset link has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-3xl font-bold">Forgot password</h1>
      <p className="mt-2 text-sm text-slate-600">Enter your email and we&apos;ll send a password reset link.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2.5" />
        </label>
        {message && <p className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">{message}</p>}
        {error && <p className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Sending…" : "Send reset link"}</button>
      </form>
      <p className="mt-6 text-center text-sm"><Link href="/login" className="underline">Back to sign in</Link></p>
    </div>
  );
}
