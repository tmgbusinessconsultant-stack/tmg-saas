import type { Metadata } from "next";
import PricingCheckout from "./pricing-checkout";

export const metadata: Metadata = {
  title: "Pricing | TMG - Packages for Qatar & Global Businesses",
  description: "Choose a TMG package and complete a secure one-time PayPal checkout. Business setup, branding, and growth solutions.",
};

export default function PricingPage() {
  return (
    <div className="min-h-[80vh] bg-[#FCFCF9]">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        {/* Header - Matching Contact & Gallery */}
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-[#D4AF37] uppercase tracking-[0.25em] text-[11px] font-bold">
            Pricing
          </p>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-zinc-900">
            Pricing for Qatar and <span className="text-[#D4AF37]">global businesses</span>
          </h1>
          <p className="mt-4 text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            Transparent packages. No subscriptions. One-time PayPal checkout with instant confirmation.
          </p>
        </div>

        {/* Checkout Component */}
        <div className="mt-14">
          <PricingCheckout />
        </div>

        {/* Trust Footer */}
        <div className="mt-16 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs text-zinc-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Secure PayPal checkout • Doha, Qatar
          </div>
        </div>
      </div>
    </div>
  );
}
