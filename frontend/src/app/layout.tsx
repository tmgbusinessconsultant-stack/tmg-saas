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

        <SiteHeader />
        <main className="min-h-screen w-full">{children}</main>

        <footer className="text-white w-full" style={{ background: "var(--footer-bg)", minHeight: "var(--footer-height)" as any }}>
          <div className="mx-auto px-4 py-10 grid md:grid-cols-3 gap-8 text-sm text-slate-300" style={{ maxWidth: "var(--container-max)" }}>
            <div>
              <div className="font-bold text-base text-white mb-3">TMG Business Consultant</div>
              <p>Helping businesses scale with practical strategy, AI tools, training, and documentation.</p>
            </div>
            <div>
              <div className="font-bold text-white mb-3">Quick Links</div>
              <ul className="space-y-2">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/services">Services</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-bold text-white mb-3">Contact</div>
              {contactEmail && <p>Email: <a className="underline underline-offset-2" href={`mailto:${contactEmail}`}>{contactEmail}</a></p>}
              {whatsappNumber && <p>WhatsApp: <a className="underline underline-offset-2" href={`https://wa.me/${whatsappNumber}`}>+{whatsappNumber}</a></p>}
              {phoneNumber && <p>Phone: <a className="underline underline-offset-2" href={`tel:${phoneNumber}`}>{phoneNumber}</a></p>}
              <Link href="/contact" className="mt-2 inline-block font-semibold text-white underline">Contact TMG</Link>
              <p className="mt-2">Doha, Qatar</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}