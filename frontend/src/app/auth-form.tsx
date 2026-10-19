"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type AuthFormProps = {
  mode: "login" | "register";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");

    if (!apiUrl) {
      setError("The account service is not configured.");
      setLoading(false);
      return;
    }

    const payload = mode === "register"
      ? {
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
        }
      : {
          email: formData.get("email"),
          password: formData.get("password"),
        };

    try {
      const response = await fetch(`${apiUrl}/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        const apiMessage = typeof result === "object" && result !== null && "message" in result
          ? Array.isArray(result.message) ? result.message.join(" ") : result.message
          : "The request could not be completed.";
        throw new Error(typeof apiMessage === "string" ? apiMessage : "The request could not be completed.");
      }

      if (mode === "register") {
        router.push("/login");
        return;
      }

      if (typeof result !== "object" || result === null || !("accessToken" in result) || typeof result.accessToken !== "string") {
        throw new Error("The account service returned an invalid sign-in response.");
      }

      sessionStorage.setItem("accessToken", result.accessToken);
      const user = "user" in result && typeof result.user === "object" && result.user !== null
        ? result.user
        : null;
      router.push(
        user && "role" in user && typeof user.role === "string" && !["CLIENT", "CUSTOMER"].includes(user.role)
          ? "/admin"
          : "/dashboard",
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not connect to the account service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">TMG account</p>
        <h1 className="mt-3 text-3xl font-bold">{mode === "login" ? "Sign in" : "Create an account"}</h1>
        {mode === "register" && (
          <p className="mt-3 text-sm leading-6 text-slate-600">New accounts are customer accounts. Administrator access is granted separately by an existing system operator.</p>
        )}
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "register" && (
            <label className="block text-sm font-medium">
              Full name
              <input name="name" required minLength={1} maxLength={100} autoComplete="name" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
          )}
          <label className="block text-sm font-medium">
            Email
            <input name="email" type="email" required maxLength={254} autoComplete="email" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input name="password" type="password" required minLength={12} maxLength={72} autoComplete={mode === "login" ? "current-password" : "new-password"} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            {mode === "register" && <span className="mt-1 block text-xs font-normal text-slate-500">Use at least 12 characters.</span>}
          </label>
          <p className="text-xs leading-5 text-slate-500">
            Account details are handled as described in our <Link href="/privacy" className="underline">Privacy Notice</Link> and <Link href="/terms" className="underline">Terms</Link>.
          </p>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-md bg-[#0F172A] px-5 py-3 font-semibold text-white disabled:opacity-60">
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
        <p className="mt-5 text-sm text-slate-600">
          {mode === "login" ? "Need an account? " : "Already registered? "}
          <Link href={mode === "login" ? "/register" : "/login"} className="font-semibold text-[#0F172A] underline">
            {mode === "login" ? "Register" : "Sign in"}
          </Link>
        </p>
      </div>
    </div>
  );
}
