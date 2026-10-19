import PricingCheckout from "./pricing-checkout";

export default function PricingPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center max-w-3xl mx-auto">
        <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs font-semibold">Pricing</p>
        <h1 className="mt-3 text-4xl font-bold">Pricing for Qatar and global businesses</h1>
        <p className="mt-4 text-slate-600">Choose a package and complete a one-time PayPal checkout.</p>
      </div>

      <PricingCheckout />
    </div>
  );
}
