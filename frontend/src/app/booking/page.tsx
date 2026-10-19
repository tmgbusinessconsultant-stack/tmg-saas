import QuoteRequestForm from "../quote-request-form";

export default function BookingPage({ source = "booking" }: { source?: "booking" | "quote" }) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs font-semibold">Get a quote</p>
          <h1 className="mt-3 text-4xl font-bold">Tell us what you need</h1>
          <p className="mt-4 text-slate-600 leading-7">
            Share your goals, service needs, and preferred timeline. We’ll respond with a tailored proposal and next steps.
          </p>
          <div className="mt-8 rounded-2xl bg-slate-100 p-6">
            <h2 className="font-bold text-xl">What you can request</h2>
            <ul className="mt-4 space-y-2 text-slate-700">
              <li>• Business consulting</li>
              <li>• AI tool setup</li>
              <li>• Process and SOP creation</li>
              <li>• Website or digital growth support</li>
            </ul>
          </div>
        </div>

        <QuoteRequestForm source={source} />
      </div>
    </div>
  );
}
