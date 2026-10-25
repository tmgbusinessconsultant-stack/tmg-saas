import type { Metadata } from "next";
import QuoteRequestForm from "@/components/quote-request-form";
import { contactEmail, whatsappNumber } from "@/lib/contact-details";

export const metadata: Metadata = {
  title: "Contact | TMG - Let's Talk About Your Next Business Move",
  description: "Contact TMG in Doha, Qatar. Get in touch for business setup, branding, and growth solutions.",
};

export default function ContactPage() {
  return (
    <div className="min-h-[80vh] bg-[#FCFCF9]">
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-[#D4AF37] uppercase tracking-[0.25em] text-[11px] font-bold">Contact</p>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-zinc-900">
            Let&apos;s talk about your <span className="text-[#D4AF37]">next business move</span>
          </h1>
          <p className="mt-4 text-zinc-500">We respond within 24 hours — WhatsApp is fastest.</p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
          {/* Contact Card */}
          <div className="md:col-span-2 rounded-[24px] border border-zinc-200 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <h2 className="text-xl font-semibold text-zinc-900">Contact details</h2>
            <div className="mt-6 space-y-5">
              <div className="flex gap-3">
                <div className="h-9 w-9 rounded-full bg-zinc-900 text-white grid place-items-center text-sm">✉</div>
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wide text-zinc-500 font-semibold">Email</div>
                  <a href={`mailto:${contactEmail}`} className="mt-1 block text-[15px] font-medium text-zinc-900 hover:text-[#D4AF37] transition-colors truncate">
                    {contactEmail}
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="h-9 w-9 rounded-full bg-[#25D366]/10 text-[#25D366] grid place-items-center text-sm">◍</div>
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wide text-zinc-500 font-semibold">WhatsApp</div>
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-[15px] font-medium text-zinc-900 hover:text-[#D4AF37] transition-colors"
                  >
                    +{whatsappNumber}
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="h-9 w-9 rounded-full bg-zinc-100 text-zinc-700 grid place-items-center text-sm">◎</div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-zinc-500 font-semibold">Location</div>
                  <div className="mt-1 text-[15px] font-medium text-zinc-900">Doha, Qatar</div>
                </div>
              </div>
            </div>

            <div className="mt-8 h-px bg-zinc-100" />
            <p className="mt-6 text-sm text-zinc-500 leading-relaxed">
              Prefer form? Fill the quote request — it auto-saves your details.
            </p>
          </div>

          {/* Form */}
          <div className="md:col-span-3 min-w-0 rounded-[24px] border border-zinc-200 bg-white p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <QuoteRequestForm />
          </div>
        </div>
      </div>
    </div>
  );
}
