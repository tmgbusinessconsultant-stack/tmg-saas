import type { Metadata } from "next";
import PricingCheckout from "./pricing-checkout";

export const metadata: Metadata = {
  title: "Pricing | TMG - Subscription Plans with 7-Day Free Trial",
  description: "Flexible monthly and annual subscription plans for Qatar and global businesses. Try 7 days free. PayPal subscriptions - cancel anytime. CV builder, business AI tools.",
};

export default function PricingPage() {
  return (
    <div className="min-h-[80vh] bg-[#FCFCF9]">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-[#D4AF37] uppercase tracking-[0.25em] text-[11px] font-bold">
            Pricing
          </p>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-zinc-900">
            Pricing for Qatar and <span className="text-[#D4AF37]">global businesses</span>
          </h1>
          <p className="mt-4 text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            Flexible subscriptions • 7-day free trial • Cancel anytime • Secure PayPal subscription with instant activation.
          </p>
        </div>

        <div className="mt-14">
          <PricingCheckout />
        </div>

        <div className="mt-16 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs text-zinc-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            PayPal Subscriptions • Cancel anytime • Doha, Qatar
          </div>
        </div>
      </div>
    </div>
  );
}
