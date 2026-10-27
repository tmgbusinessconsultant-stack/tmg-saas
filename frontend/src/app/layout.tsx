import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import { GlobalStyles } from "@/components/GlobalStyles";
import { contactEmail, phoneNumber, whatsappNumber } from "@/lib/contact-details";

export const metadata: Metadata = {
  metadataBase: new URL("https://tmgbusinessconsulting.com"),
  title: {
    default: "TMG Business Consulting | AI Consulting, Strategy & Growth",
    template: "%s | TMG Business Consulting",
  },
  description:
    "TMG Business Consulting helps founders and SMEs in Qatar and globally with strategy, AI tools, productivity training, consultations, and digital business growth solutions.",
  keywords: [
    "TMG Business Consulting",
    "Qatar business setup",
    "AI consulting",
    "business strategy",
    "productivity training",
    "digital products",
    "SOP generator",
    "business plan generator",
  ],
  openGraph: {
    title: "TMG Business Consulting",
    description: "AI-powered business consulting and growth support for SMEs in Qatar and beyond.",
    url: "https://tmgbusinessconsulting.com",
    siteName: "TMG Business Consulting",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TMG Business Consulting",
    description: "AI-powered consulting, training, and business services.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {/* SINGLE SOURCE OF TRUTH - Loads all 22 design fields */}
        <GlobalStyles />

        {/* Global Navigation Header Component */}
        <SiteHeader />

        {/* Render Workspace Viewport Mount Node */}
        <main className="min-h-screen w-full">{children}</main>

        {/* Premium Synchronized Application Footer Structure */}
        <footer className="text-white w-full flex flex-col justify-between border-t border-zinc-800/20" style={{ background: "var(--footer-bg)", minHeight: "var(--footer-height)" as any }}>
          <div className="mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-slate-300 w-full flex-grow" style={{ maxWidth: "var(--container-max)" }}>

            {/* Branding Mission Brief */}
            <div className="space-y-3">
              <div className="font-black text-base text-white tracking-tight">TMG Business Consulting</div>
              <p className="leading-relaxed text-slate-400">
                Helping businesses, founders, and growing teams scale with practical strategy, optimized AI tools, productivity training, and regulatory documentation.
              </p>
            </div>

            {/* Structured Navigation Paths Mapping */}
            <div className="space-y-3">
              <div className="font-bold text-white text-sm uppercase tracking-wider opacity-90">Quick Links</div>
              <ul className="space-y-2 font-medium">
                <li><Link href="/about" className="hover:text-white transition-colors">About TMG</Link></li>
                <li><Link href="/services" className="hover:text-white transition-colors">Services</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Localized Direct Contact Channels Mapping Block */}
            <div className="space-y-3">
              <div className="font-bold text-white text-sm uppercase tracking-wider opacity-90">Contact Channel Hub</div>
              <div className="space-y-1.5 font-medium">
                {contactEmail && <p className="text-slate-400">Email: <a className="text-slate-200 underline underline-offset-4 hover:text-white transition-all" href={`mailto:${contactEmail}`}>{contactEmail}</a></p>}
                {whatsappNumber && <p className="text-slate-400">WhatsApp: <a className="text-slate-200 underline underline-offset-4 hover:text-white transition-all" href={`https://wa.me/${whatsappNumber}`}>+{whatsappNumber}</a></p>}
                {phoneNumber && <p className="text-slate-400">Phone: <a className="text-slate-200 underline underline-offset-4 hover:text-white transition-all" href={`tel:${phoneNumber}`}>+{phoneNumber}</a></p>}
              </div>
              <div className="pt-2 border-t border-slate-700/40 text-xs font-semibold text-slate-400">
                Corporate Location: <span className="text-white font-bold">Doha, Qatar</span>
              </div>
            </div>

          </div>

          {/* Secure Transacted Networks Attestation Row */}
          <div className="w-full border-t border-slate-800/80 py-4 bg-black/10">
            <div className="mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500 font-medium w-full" style={{ maxWidth: "var(--container-max)" }}>
              <div>© 2026 TMG Business Consulting. All Rights Reserved.</div>
              <div className="font-mono text-[11px] tracking-wide text-slate-600">
                Accepted Clearances: Visa &bull; Mastercard &bull; PayPal &bull; Apple Pay
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
