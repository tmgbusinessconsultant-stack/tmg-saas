"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

type AuthFormProps = {
  mode: "login" | "register";
};

type ApiError = { message?: string | string[] };
type AuthUser = { role?: string; id?: string; email?: string; name?: string };
type AuthResult = ApiError & {
  accessToken?: string;
  refreshToken?: string;
  user?: AuthUser;
  requiresMfa?: boolean;
  challengeToken?: string;
  message?: string | string[];
};

function toMessage(raw: unknown, fallback: string): string {
  if (Array.isArray(raw)) return raw.join(" ");
  if (typeof raw === "string" && raw.trim()) return raw;
  return fallback;
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectCandidate = searchParams.get("next") || searchParams.get("redirect");
  const next = redirectCandidate?.startsWith("/")
    && !redirectCandidate.startsWith("//")
    && !redirectCandidate.includes("\\")
    ? redirectCandidate
    : null;

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [emailForResend, setEmailForResend] = useState("");

  function persistSession(result: AuthResult) {
    if (!result.accessToken) return;
    try {
      localStorage.setItem("accessToken", result.accessToken);
      localStorage.setItem("token", result.accessToken);
      sessionStorage.setItem("accessToken", result.accessToken);
      if (result.refreshToken) localStorage.setItem("refreshToken", result.refreshToken);
      if (result.user) localStorage.setItem("user", JSON.stringify(result.user));
      window.dispatchEvent(new Event("tmg-auth-changed"));
    } catch {}
  }

  function redirectAfterLogin(user?: AuthUser) {
    const role = user?.role;
    router.push(next ? next : role && !["CLIENT", "CUSTOMER"].includes(role) ? "/admin" : "/dashboard");
    router.refresh();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setNotice("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const name = String(formData.get("name") || "").trim();
    setEmailForResend(email);

    if (!email || !password || (mode === "register" && !name)) {
      setError("Please fill all required fields.");
      setLoading(false);
      return;
    }
    if (mode === "register" && name.length < 2) {
      setError("Name must be at least 2 characters.");
      setLoading(false);
      return;
    }
    if (mode === "register" && password.length < 12) {
      setError("Password must be at least 12 characters.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(mode === "register" ? { name, email, password } : { email, password }),
      });

      const result = (await response.json().catch(() => ({}))) as AuthResult;
      if (!response.ok) {
        throw new Error(toMessage(result.message, "Request failed. Please try again."));
      }

      if (mode === "register") {
        const msg = toMessage(result.message, "Account created. Please check your email to verify your account before signing in.");
        setNotice(msg);
        setLoading(false);
        return;
      }

      if (result.requiresMfa && result.challengeToken) {
        setMfaChallengeToken(result.challengeToken);
        setNotice("Enter the 6-digit code from your authenticator app to complete sign-in.");
        setLoading(false);
        return;
      }

      persistSession(result);
      redirectAfterLogin(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect to account service.");
    } finally {
      setLoading(false);
    }
  }

  async function submitMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mfaChallengeToken || loading) return;
    if (mfaCode.trim().length < 6) {
      setError("Enter a valid authentication code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeToken: mfaChallengeToken, code: mfaCode.trim() }),
      });
      const result = (await response.json().catch(() => ({}))) as AuthResult;
      if (!response.ok) throw new Error(toMessage(result.message, "Invalid authentication code."));
      persistSession(result);
      redirectAfterLogin(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "MFA verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    const email = emailForResend || String((document.querySelector('input[name="email"]') as HTMLInputElement | null)?.value || "").trim().toLowerCase();
    if (!email) { setError("Enter your email address first."); return; }
    setLoading(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json().catch(() => ({}))) as ApiError & { message?: string };
      if (!response.ok) throw new Error(toMessage(result.message, "Could not resend verification email."));
      setNotice(toMessage(result.message, "If an unverified account exists for this email, a verification link has been sent."));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend verification email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto px-6 py-16" style={{ maxWidth: "var(--container-max)" }}>
      <div
        className="mx-auto max-w-md border bg-white p-8 shadow-sm"
        style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)", borderWidth: "var(--border-width)", background: "var(--card-bg)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--gold)" }}>
          TMG account
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-family)" }}>
          {mode === "login" ? (mfaChallengeToken ? "Two-factor verification" : "Sign in") : "Create an account"}
        </h1>

        {mode === "register" && (
          <p className="mt-3 text-sm leading-6 text-slate-600">
            New accounts are customer accounts. Verify your email before signing in. Admin access is granted separately.
          </p>
        )}

        {searchParams.get("registered") === "1" && mode === "login" && !notice && (
          <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800 border border-green-200">
            Account created. Check your email for a verification link before signing in.
          </p>
        )}
        {searchParams.get("verified") === "1" && mode === "login" && !notice && (
          <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800 border border-green-200">
            Email verified successfully. You can now sign in.
          </p>
        )}
        {searchParams.get("reset") === "1" && mode === "login" && !notice && (
          <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800 border border-green-200">
            Password reset successfully. Sign in with your new password.
          </p>
        )}

        {mfaChallengeToken && mode === "login" ? (
          <form onSubmit={submitMfa} className="mt-6 space-y-4" noValidate>
            <label className="block text-sm font-medium">
              Authentication code
              <input
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                minLength={6}
                maxLength={8}
                className="mt-1 w-full border px-3 py-2.5 outline-none transition focus:ring-2"
                style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)" }}
                placeholder="123456"
              />
            </label>
            {notice && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 border border-blue-200">{notice}</p>}
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">{error}</p>}
            <button type="submit" disabled={loading} className="w-full font-semibold text-white transition hover:opacity-90 disabled:opacity-60" style={{ borderRadius: "var(--button-radius)", minHeight: "var(--button-height)", background: "var(--primary)" }}>
              {loading ? "Verifying…" : "Verify and sign in"}
            </button>
            <button type="button" onClick={() => { setMfaChallengeToken(null); setMfaCode(""); setNotice(""); }} className="w-full text-sm underline" style={{ color: "var(--primary)" }}>
              Back to sign in
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
              {mode === "register" && (
                <label className="block text-sm font-medium">
                  Full name
                  <input
                    name="name"
                    required
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                    placeholder="Ahmed Al Thani"
                    className="mt-1 w-full border px-3 py-2.5 outline-none transition focus:ring-2"
                    style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)" }}
                  />
                </label>
              )}

              <label className="block text-sm font-medium">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="mt-1 w-full border px-3 py-2.5 outline-none transition focus:ring-2"
                  style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)" }}
                />
              </label>

              <label className="block text-sm font-medium">
                <span className="flex items-center justify-between">
                  Password
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="text-xs font-normal underline" style={{ color: "var(--primary)" }}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </span>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={12}
                  maxLength={72}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="mt-1 w-full border px-3 py-2.5 outline-none transition focus:ring-2"
                  style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)" }}
                />
                {mode === "register" && <span className="mt-1.5 block text-xs text-slate-500">Min 12 characters.</span>}
              </label>

              {mode === "login" && (
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-xs underline" style={{ color: "var(--primary)" }}>Forgot password?</Link>
                </div>
              )}

              <p className="text-xs leading-5 text-slate-500">
                By continuing you agree to our{" "}
                <Link href="/privacy" className="underline" style={{ color: "var(--primary)" }}>Privacy</Link> and{" "}
                <Link href="/terms" className="underline" style={{ color: "var(--primary)" }}>Terms</Link>.
              </p>

              {notice && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800 border border-green-200">{notice}</p>}
              {error && <p role="alert" aria-live="assertive" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full font-semibold text-white transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ borderRadius: "var(--button-radius)", minHeight: "var(--button-height)", background: "var(--primary)" }}
              >
                {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            {mode === "login" && (
              <div className="mt-4 text-center">
                <button type="button" onClick={() => void resendVerification()} disabled={loading} className="text-xs underline" style={{ color: "var(--primary)" }}>
                  Resend verification email
                </button>
              </div>
            )}
          </>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          {mode === "login" ? "Need an account? " : "Already registered? "}
          <Link
            href={mode === "login" ? `/register${next ? `?next=${encodeURIComponent(next)}` : ""}` : `/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-semibold underline"
            style={{ color: "var(--primary)" }}
          >
            {mode === "login" ? "Create account" : "Sign in"}
          </Link>
        </p>
      </div>
    </div>
  );
}
