import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "../auth-form";

export const metadata: Metadata = {
  title: "Sign in | TMG Business Consulting",
  description: "Sign in to your TMG client portal to manage projects, AI tools, and consultations.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  alternates: {
    canonical: "https://tmgbusinessconsulting.com/login",
  },
};

function LoginFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-[var(--background)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--primary)]" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}