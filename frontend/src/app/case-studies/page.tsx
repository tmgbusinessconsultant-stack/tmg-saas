import Link from "next/link";
import PublishedMediaSection from "@/components/published-media-section";

export default function CaseStudiesPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Our work</p>
        <h1 className="mt-3 text-4xl font-bold">Case studies</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">Selected work and outcomes from TMG Business Consulting.</p>
      </header>
      <PublishedMediaSection location="case-study" title="Featured case studies" />
      <p className="mt-8 text-center"><Link href="/contact" className="font-semibold underline">Discuss a project with TMG</Link></p>
    </main>
  );
}
