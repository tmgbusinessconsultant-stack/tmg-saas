import Link from "next/link";
import PublishedMediaSection from "@/components/published-media-section";

export default function CaseStudiesPage() {
  return (
    <main className="min-h-screen bg-[#FCFCF9]">
      <div className="mx-auto max-w-7xl px-6 py-14 md:py-20">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">Our Work • Results</p>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 leading-[1.1]">Case studies</h1>
          <p className="mt-5 text-[15px] leading-7 text-zinc-500 max-w-2xl mx-auto">
            Selected work and outcomes from TMG Business Consulting — strategy, AI setup, SOPs, and growth support across Qatar & GCC.
          </p>
        </header>

        <div className="mt-14">
          <PublishedMediaSection location="case-study" title="Featured case studies" />
        </div>

        <div className="mt-16 flex justify-center">
          <Link href="/contact" className="inline-flex rounded-full bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white hover:bg-black transition-colors">
            Discuss a project with TMG
          </Link>
        </div>
      </div>
    </main>
  );
}
