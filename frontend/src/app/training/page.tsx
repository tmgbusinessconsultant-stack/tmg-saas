import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business, AI and Productivity Training | TMG",
  description: "Practical leadership, business, AI and productivity training for teams in Qatar and worldwide. Tailored workshops for your organization.",
  alternates: { canonical: "https://tmgbusinessconsulting.com/training" },
  openGraph: {
    title: "Business, AI and Productivity Training | TMG",
    description: "Practical workshops for leadership, AI adoption, and productivity.",
    url: "https://tmgbusinessconsulting.com/training",
    type: "website",
    siteName: "TMG Business Consulting",
  },
  twitter: { card: "summary", title: "Business, AI and Productivity Training | TMG" },
};

const courses = [
  { name: "Leadership and team development", desc: "Build high-performing teams, decision-making and accountability." },
  { name: "AI tools and responsible adoption", desc: "Practical AI workflows, prompt engineering, and safe adoption policies." },
  { name: "Business analysis and operations", desc: "Process mapping, SOPs, KPIs and operations excellence." },
  { name: "Productivity and workflow improvement", desc: "Time management, automation, and productivity systems for teams." },
];

const trainingSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "TMG training programs",
  itemListElement: courses.map((course, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Course",
      name: course.name,
      description: course.desc,
      provider: {
        "@type": "Organization",
        name: "TMG Business Consulting",
        url: "https://tmgbusinessconsulting.com",
        sameAs: "https://tmgbusinessconsulting.com"
      },
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
        category: "Training"
      }
    },
  })),
};

export default function TrainingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(trainingSchema) }} />
      <main className="mx-auto px-6 py-16" style={{ maxWidth: "var(--container-max)" }}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--gold)" }}>Team development</p>
        <h1 className="mt-3 font-bold tracking-tight" style={{ fontSize: "var(--h1-size)", fontFamily: "var(--font-family)", lineHeight: "1.1" }}>
          Business, AI and productivity training
        </h1>
        <p className="mt-5 max-w-3xl leading-8 text-slate-600" style={{ fontSize: "var(--font-size)", lineHeight: "var(--line-height)" }}>
          Practical workshops and tailored programs help teams strengthen leadership, business analysis, responsible AI use, and day-to-day productivity. Program content, delivery format, and pricing are agreed for each organization.
        </p>

        <div className="mt-9 grid gap-5 sm:grid-cols-2">
          {courses.map((course) => (
            <article key={course.name} className="border bg-white p-6 shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: "var(--radius)", borderColor: "var(--border-color)", background: "var(--card-bg)" }}>
              <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-family)" }}>{course.name}</h2>
              <p className="mt-2 text-slate-600">{course.desc}</p>
            </article>
          ))}
        </div>

        <Link
          href="/quote"
          className="mt-8 inline-flex items-center justify-center font-semibold text-white transition hover:opacity-90"
          style={{ borderRadius: "var(--button-radius)", minHeight: "var(--button-height)", background: "var(--primary)", paddingLeft: "20px", paddingRight: "20px" }}
        >
          Discuss a training program
        </Link>
      </main>
    </>
  );
}