"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";

function ResetInner() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(token ? "" : "Missing reset token.");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (password.length < 12) { setError("Password must be at least 12 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Reset failed.");
      setMessage(data.message || "Password reset successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed.");
    } finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-3xl font-bold">Reset password</h1>
      <p className="mt-2 text-sm text-slate-600">Choose a new password (minimum 12 characters).</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">New password
          <input type="password" required minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2.5" />
        </label>
        <label className="block text-sm font-medium">Confirm password
          <input type="password" required minLength={12} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2.5" />
        </label>
        {message && <p className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">{message}</p>}
        {error && <p className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={loading || !token} className="w-full rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Resetting…" : "Reset password"}</button>
      </form>
      <p className="mt-6 text-center text-sm"><Link href={message ? "/login?reset=1" : "/login"} className="underline">{message ? "Sign in now" : "Back to sign in"}</Link></p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div className="px-6 py-20 text-center">Loading…</div>}><ResetInner /></Suspense>;
}
