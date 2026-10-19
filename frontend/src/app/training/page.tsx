import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business, AI and Productivity Training",
  description: "Practical leadership, business, AI and productivity training for teams in Qatar and worldwide.",
  alternates: { canonical: "/training" },
  openGraph: { title: "Business, AI and Productivity Training", url: "/training", type: "website" },
  twitter: { card: "summary", title: "Business, AI and Productivity Training" },
};

const trainingSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "TMG training programs",
  itemListElement: [
    "Leadership and team development",
    "AI tools and responsible adoption",
    "Business analysis and operations",
    "Productivity and workflow improvement",
  ].map((name, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: { "@type": "Course", name, provider: { "@type": "Organization", name: "TMG Business Consulting" } },
  })),
};

export default function TrainingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(trainingSchema) }} />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Team development</p>
        <h1 className="mt-3 text-4xl font-bold">Business, AI and productivity training</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Practical workshops and tailored programs help teams strengthen leadership, business analysis, responsible AI use, and day-to-day productivity. Program content, delivery format, and pricing are agreed for each organization.</p>
        <div className="mt-9 grid gap-5 sm:grid-cols-2">
          {trainingSchema.itemListElement.map(({ item }) => <article key={item.name} className="rounded-xl border bg-white p-6"><h2 className="text-xl font-bold">{item.name}</h2><p className="mt-2 text-slate-600">A tailored program based on your team’s goals and operating context.</p></article>)}
        </div>
        <Link href="/quote" className="mt-8 inline-flex rounded-md bg-[#0F172A] px-5 py-3 font-semibold text-white">Discuss a training program</Link>
      </main>
    </>
  );
}
