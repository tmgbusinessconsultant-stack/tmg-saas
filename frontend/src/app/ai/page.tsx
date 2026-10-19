import type { Metadata } from "next";
import BusinessAssistant from "../ai-tools/business-assistant/page";

export const metadata: Metadata = {
  title: "Ask TMG AI",
  description: "Ask general questions about TMG business consulting services and business topics.",
  alternates: { canonical: "/ai" },
  openGraph: { title: "Ask TMG AI", description: "General business guidance and information about TMG services.", url: "/ai", type: "website" },
  twitter: { card: "summary", title: "Ask TMG AI" },
};

export default function AiPage() {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "TMG AI Business Assistant",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: "A general AI assistant for business questions and information about TMG services.",
    url: "https://tmgbusinessconsulting.com/ai",
    provider: { "@type": "Organization", name: "TMG Business Consulting", url: "https://tmgbusinessconsulting.com" },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <header className="mx-auto mb-8 max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">TMG AI</p>
          <h1 className="mt-3 text-4xl font-bold">Ask a business question</h1>
          <p className="mt-4 text-slate-600">Get general guidance on consulting, automation, data analysis, Power BI, training, and business setup.</p>
        </header>
        <BusinessAssistant />
        <p className="mx-auto mt-5 max-w-3xl text-center text-sm text-slate-500">
          Do not enter confidential or sensitive information. Conversations are stored for up to 90 days for service quality and can be deleted by an administrator. AI responses are general guidance, not professional legal, financial, or regulatory advice.
        </p>
      </main>
    </>
  );
}
