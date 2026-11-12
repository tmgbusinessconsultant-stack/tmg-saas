export const dynamic = 'force-dynamic';
import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "../auth-form";
import FacebookLoginButton from "@/components/facebook-login-button";
import InstagramLoginButton from "@/components/instagram-login-button";

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
      <div className="flex flex-col gap-3 max-w-md mx-auto -mt-4 px-4 pb-8">
        <FacebookLoginButton />
        <InstagramLoginButton />
      </div>
    </Suspense>
  );
}
