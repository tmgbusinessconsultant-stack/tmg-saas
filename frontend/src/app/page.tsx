export const dynamic = 'force-dynamic';

import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { mediaUrl } from "@/lib/content-management";
import { defaultHomepageContent, type HomepageContent } from "@/lib/homepage-content";
import PublishedMediaSection from "@/components/published-media-section";

async function loadHomepageContent(): Promise<HomepageContent> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
    if (!base) return defaultHomepageContent;
    const response = await fetch(`${base}/content/homepage`, { cache: "no-store" });
    if (!response.ok) {
      console.warn(`Homepage API returned ${response.status}, using fallback`);
      return defaultHomepageContent;
    }
    const body = await response.text();
    if (!body.trim()) return defaultHomepageContent;
    let value: Partial<HomepageContent> | null;
    try {
      value = JSON.parse(body) as Partial<HomepageContent> | null;
    } catch {
      console.warn("Homepage content was not valid JSON, using fallback");
      return defaultHomepageContent;
    }
    if (!value) return defaultHomepageContent;
    return {
      ...defaultHomepageContent,
      ...value,
      hero: { ...defaultHomepageContent.hero, ...value.hero },
      quickCard: { ...defaultHomepageContent.quickCard, ...value.quickCard },
      services: { ...defaultHomepageContent.services, ...value.services },
      about: { ...defaultHomepageContent.about, ...value.about },
      testimonials: { ...defaultHomepageContent.testimonials, ...value.testimonials },
      cta: { ...defaultHomepageContent.cta, ...value.cta },
    };
  } catch (e) {
    console.warn("Could not load homepage content, using default:", e);
    return defaultHomepageContent;
  }
}

export default function Home() {
  return (
    <Suspense fallback={<HomePageContent content={defaultHomepageContent} />}>
      <LiveHomepageContent />
    </Suspense>
  );
}

async function LiveHomepageContent() {
  const content = await loadHomepageContent();
  return <HomePageContent content={content} />;
}

function HomePageContent({ content }: { content: HomepageContent }) {
  return (
    <div>
      <section className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white">
        <div className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37] px-3 py-1 rounded-full text-xs mb-4">
              {content.hero.kicker}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              {content.hero.title} <span className="text-[#D4AF37]">{content.hero.highlight}</span>
            </h1>
            <p className="mt-6 text-gray-300 text-lg">{content.hero.description}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href={content.hero.primaryHref} className="bg-[#D4AF37] text-black px-8 py-3 rounded-md font-bold hover:bg-white transition">{content.hero.primaryText}</Link>
              <Link href={content.hero.secondaryHref} className="border border-white px-8 py-3 rounded-md hover:bg-white hover:text-black transition">{content.hero.secondaryText}</Link>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-8 text-black shadow-2xl">
            {content.hero.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(content.hero.imageUrl)} alt="" className="mb-6 max-h-48 w-full rounded-lg object-cover" />
            ) : (
              <div className="flex justify-center mb-6">
                <Image src="/logo.png" alt="TMG" width={200} height={70} className="h-16 w-auto" />
              </div>
            )}
            <h3 className="font-bold text-xl">{content.quickCard.title}</h3>
            <p className="text-sm text-gray-600 mt-2 mb-6">{content.quickCard.description}</p>
            <Link href={content.quickCard.buttonHref} className="block text-center bg-[#0F172A] text-white py-3 rounded-md font-semibold hover:bg-[#D4AF37] hover:text-black transition">{content.quickCard.buttonText}</Link>
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
              {content.statistics.map((stat) => <div key={`${stat.value}-${stat.label}`} className="bg-[#F8FAFC] p-3 rounded border"><strong>{stat.value}</strong> {stat.label}</div>)}
            </div>
          </div>
        </div>
      </section>
      <PublishedMediaSection location="homepage" title="From our work" />
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-[#D4AF37] font-semibold uppercase tracking-[0.2em] text-xs">Our Services</p>
          <h2 className="text-3xl md:text-4xl font-bold mt-3">{content.services.heading}</h2>
        </div>
        <div className="mt-10 grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {content.services.cards.map((service) => (
            <div key={service.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg transition">
              <div className="text-[#D4AF37] font-bold text-sm uppercase tracking-wide">TMG</div>
              <h3 className="mt-4 text-xl font-bold">{service.title}</h3>
              <p className="mt-3 text-slate-600">{service.description}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs font-semibold">About TMG</p>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">{content.about.title}</h2>
            <p className="mt-5 text-slate-600 leading-7">{content.about.description}</p>
            <div className="mt-8 space-y-4">
              {content.about.reasons.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-black">✓</span>
                  <p className="text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl bg-[#0F172A] p-8 text-white shadow-xl">
            <h3 className="text-2xl font-bold">{content.about.asideTitle}</h3>
            <ul className="mt-6 space-y-4 text-slate-200">
              {content.about.asideItems.map((item) => <li key={item}>• {item}</li>)}
            </ul>
            <Link href="/about" className="mt-8 inline-block bg-[#D4AF37] text-black px-6 py-3 rounded-md font-bold">Learn more</Link>
          </div>
        </div>
      </section>
      {content.testimonials.items.some((item) => item.approved) && <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs font-semibold">Testimonials</p>
          <h2 className="text-3xl font-bold mt-3">{content.testimonials.heading}</h2>
        </div>
        <div className="mt-10 grid md:grid-cols-2 gap-6">
          {content.testimonials.items.filter((item) => item.approved).map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {item.photoUrl && <Image src={mediaUrl(item.photoUrl)} alt="" width={56} height={56} unoptimized className="mb-4 h-14 w-14 rounded-full object-cover" />}
              <div className="text-amber-600">{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</div>
              <p className="mt-3 leading-7 text-slate-700">“{item.quote}”</p>
              <div className="mt-6 font-semibold text-[#0F172A]">{item.clientName}{item.company ? `, ${item.company}` : ""}</div>
            </div>
          ))}
        </div>
      </section>}
      <section className="bg-[#0F172A] text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">{content.cta.heading}</h2>
          <p className="mt-4 text-slate-300">{content.cta.description}</p>
          <div className="mt-8 flex justify-center flex-wrap gap-4">
            <Link href={content.cta.primaryHref} className="bg-[#D4AF37] text-black px-8 py-3 rounded-md font-bold">{content.cta.primaryText}</Link>
            <Link href={content.cta.secondaryHref} className="border border-white px-8 py-3 rounded-md">{content.cta.secondaryText}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}