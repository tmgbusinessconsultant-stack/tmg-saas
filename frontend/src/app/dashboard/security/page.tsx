"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Me = { email?: string; mfaEnabled?: boolean; emailVerified?: boolean };

function getStoredToken(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken") || "";
}

export default function SecurityPage() {
  const [token] = useState(getStoredToken);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(Boolean(getStoredToken()));
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [qr, setQr] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async (accessToken: string) => {
    const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) throw new Error("Could not load account.");
    setMe(await res.json());
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const run = async () => {
      try {
        await load(token);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Could not load account.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void run();
    return () => { active = false; };
  }, [token, load]);

  async function startSetup() {
    setError(""); setNotice(""); setQr("");
    const res = await fetch("/api/auth/mfa/setup", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.message || "Could not start MFA setup."); return; }
    setSecret(data.secret || "");
    setOtpauthUrl(data.otpauthUrl || "");
    try {
      const QRCode = (await import("qrcode")).default;
      setQr(await QRCode.toDataURL(data.otpauthUrl));
    } catch { /* show secret only */ }
  }

  async function enableMfa() {
    setError(""); setNotice("");
    const res = await fetch("/api/auth/mfa/enable", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: code.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.message || "Could not enable MFA."); return; }
    setNotice(data.message || "MFA enabled.");
    setSecret(""); setOtpauthUrl(""); setQr(""); setCode("");
    await load(token).catch(() => {});
  }

  async function disableMfa() {
    if (!confirm("Disable multi-factor authentication?")) return;
    setError(""); setNotice("");
    const res = await fetch("/api/auth/mfa/disable", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.message || "Could not disable MFA."); return; }
    setNotice(data.message || "MFA disabled.");
    await load(token).catch(() => {});
  }

  if (loading) return <div className="mx-auto max-w-2xl px-6 py-16">Loading…</div>;
  if (!token) return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-3xl font-bold">Sign in required</h1>
      <Link href="/login?next=/dashboard/security" className="mt-4 inline-block rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white">Sign in</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">Account</p>
      <h1 className="mt-2 text-3xl font-bold">Security settings</h1>
      <p className="mt-2 text-sm text-slate-600">{me?.email} · Email {me?.emailVerified ? "verified" : "not verified"} · MFA {me?.mfaEnabled ? "enabled" : "disabled"}</p>

      {(error || notice) && (
        <div className={`mt-6 rounded-lg border p-4 text-sm ${error ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-800"}`}>{error || notice}</div>
      )}

      <section className="mt-8 rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Multi-factor authentication (TOTP)</h2>
        <p className="mt-2 text-sm text-slate-600">Use an authenticator app (Google Authenticator, Microsoft Authenticator, Authy, etc.) for an extra sign-in step.</p>

        {me?.mfaEnabled ? (
          <button onClick={() => void disableMfa()} className="mt-4 rounded-full border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50">Disable MFA</button>
        ) : !secret ? (
          <button onClick={() => void startSetup()} className="mt-4 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white">Set up MFA</button>
        ) : (
          <div className="mt-4 space-y-4">
            {qr && <Image src={qr} alt="MFA QR code" width={176} height={176} unoptimized className="h-44 w-44 rounded border p-2" />}
            <div className="text-sm">
              <p className="font-medium">Secret (manual entry)</p>
              <code className="mt-1 block break-all rounded bg-slate-50 p-2 text-xs">{secret}</code>
              {otpauthUrl && <p className="mt-2 text-xs text-slate-500 break-all">{otpauthUrl}</p>}
            </div>
            <label className="block text-sm font-medium">Enter 6-digit code to confirm
              <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={8} className="mt-1 w-full rounded-lg border px-3 py-2.5" placeholder="123456" />
            </label>
            <div className="flex gap-2">
              <button onClick={() => void enableMfa()} className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white">Enable MFA</button>
              <button onClick={() => { setSecret(""); setOtpauthUrl(""); setQr(""); setCode(""); }} className="rounded-full border px-5 py-2.5 text-sm font-semibold">Cancel</button>
            </div>
          </div>
        )}
      </section>

      <div className="mt-8">
        <Link href="/dashboard" className="text-sm font-semibold underline">← Back to dashboard</Link>
      </div>
    </div>
  );
}
