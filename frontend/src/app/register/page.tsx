import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "../auth-form";

export const metadata: Metadata = {
  metadataBase: new URL("https://tmgbusinessconsulting.com"),
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
    title: "Create Account | TMG Business Consulting",
    description: "Join TMG to access AI-powered business consulting tools.",
    url: "https://tmgbusinessconsulting.com/register",
    siteName: "TMG Business Consulting",
    type: "website",
  },
};

export default function RegisterPage() {
  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12 font-sans antialiased" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-md mx-auto space-y-6">

        {/* Core Branding Orientation Context */}
        <div className="text-center space-y-2">
          <p className="uppercase tracking-[0.25em] text-[10px] font-black" style={{ color: "var(--gold)" }}>
            Onboarding Matrix
          </p>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">
            Initialize Client Profile
          </h1>
          <p className="text-xs text-zinc-500 font-semibold max-w-xs mx-auto">
            Establish secure portal clearance parameters to unlock international tool capabilities.
          </p>
        </div>

        {/* Dynamic Authenticated Session Intercept Layer Slot */}
        <div className="border shadow-md p-6 sm:p-8" style={{ borderRadius: "var(--radius)", background: "var(--card-bg)", borderColor: "var(--border-color)", borderWidth: "var(--border-width)" }}>
          <Suspense fallback={
            <div className="min-h-[250px] flex flex-col items-center justify-center gap-3">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-200" style={{ borderTopColor: "var(--primary)" }} />
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest animate-pulse">Mounting Form Context…</p>
            </div>
          }>
            <AuthForm mode="register" />
          </Suspense>
        </div>

        {/* Global Compliance Framework Attestation Footer Note */}
        <p className="text-center text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
          Secure Encrypted Credentials Vault &bull; Doha, Qatar
        </p>

      </div>
    </div>
  );
}
