import QuoteRequestForm from "../quote-request-form";
import { contactEmail, whatsappNumber } from "@/lib/contact-details";

export default function ContactPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs font-semibold">Contact</p>
        <h1 className="mt-3 text-4xl font-bold">Let’s talk about your next business move</h1>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Contact details</h2>
          <ul className="mt-6 space-y-4 text-slate-700">
            <li>Email: <a className="break-all underline sm:break-normal" href={`mailto:${contactEmail}`}>{contactEmail}</a></li>
            <li>WhatsApp: <a className="underline" href={`https://wa.me/${whatsappNumber}`}>+{whatsappNumber}</a></li>
            <li>Location: Doha, Qatar</li>
          </ul>
        </div>

        <div className="min-w-0"><QuoteRequestForm source="contact" /></div>
      </div>
    </div>
  );
}
