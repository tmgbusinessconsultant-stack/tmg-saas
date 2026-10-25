import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "../auth-form";

export const metadata: Metadata = {
  title: "Create Account | TMG Business Consulting",
  description: "Create your TMG client account to access AI tools, proposals, and business growth services.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
  alternates: {
    canonical: "https://tmgbusinessconsulting.com/register",
  },
  openGraph: {
    title: "Create Account | TMG",
    description: "Join TMG to access AI-powered business consulting tools.",
    url: "https://tmgbusinessconsulting.com/register",
    siteName: "TMG Business Consulting",
    type: "website",
  },
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" /></div>}>
      <AuthForm mode="register" />
    </Suspense>
  );
}
