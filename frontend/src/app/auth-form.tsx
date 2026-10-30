"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

type AuthFormProps = {
  mode: "login" | "register";
};

type ApiError = { message?: string | string[] };

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next")?.startsWith("/") ? searchParams.get("next") : null;

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const name = String(formData.get("name") || "").trim();

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

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(mode === "register" ? { name, email, password } : { email, password }),
      });

      const result = (await response.json().catch(() => ({}))) as ApiError & { 
        accessToken?: string;
        refreshToken?: string;
        user?: { role?: string; id?: string; email?: string };
      };

      if (!response.ok) {
        const raw = result.message;
        const msg = Array.isArray(raw) ? raw.join(" ") : raw || "Request failed. Please try again.";
        throw new Error(msg);
      }

      if (mode === "register") {
        router.push("/login?registered=1");
        return;
      }

      // ✅ SAVE TOKEN - THIS WAS MISSING!
      if (result.accessToken) {
        try {
          localStorage.setItem("accessToken", result.accessToken);
          localStorage.setItem("token", result.accessToken);
          sessionStorage.setItem("accessToken", result.accessToken);
          if (result.refreshToken) {
            localStorage.setItem("refreshToken", result.refreshToken);
          }
          if (result.user) {
            localStorage.setItem("user", JSON.stringify(result.user));
          }
        } catch {}
      }

      const role = result.user?.role;
      router.push(next ? next : role && !["CLIENT", "CUSTOMER"].includes(role) ? "/admin" : "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect to account service.");
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
          {mode === "login" ? "Sign in" : "Create an account"}
        </h1>

        {mode === "register" && (
          <p className="mt-3 text-sm leading-6 text-slate-600">
            New accounts are customer accounts. Admin access is granted separately.
          </p>
        )}

        {searchParams.get("registered") === "1" && mode === "login" && (
          <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800 border border-green-200">
            Account created. Please sign in.
          </p>
        )}

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
              <button type="button" onClick={() => setShowPassword(v => !v)} className="text-xs font-normal underline"style={{ color: "var(--primary)" }}>
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

          <p className="text-xs leading-5 text-slate-500">
            By continuing you agree to our{" "}
            <Link href="/privacy" className="underline" style={{ color: "var(--primary)" }}>Privacy</Link> and{" "}
            <Link href="/terms" className="underline" style={{ color: "var(--primary)" }}>Terms</Link>.
          </p>

          {error && (
            <p role="alert" aria-live="assertive" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-semibold text-white transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ borderRadius: "var(--button-radius)", minHeight: "var(--button-height)", background: "var(--primary)" }}
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

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

