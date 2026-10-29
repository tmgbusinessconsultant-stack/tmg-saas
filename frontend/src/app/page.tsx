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
    if (!response.ok) return defaultHomepageContent;
    const body = await response.text();
    if (!body.trim()) return defaultHomepageContent;
    const value = JSON.parse(body) as Partial<HomepageContent>;
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
  } catch {
    return defaultHomepageContent;
  }
}

export default function Home() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <LiveHomepageContent />
    </Suspense>
  );
}

async function LiveHomepageContent() {
  const content = await loadHomepageContent();
  return <HomePageContent content={content} />;
}

function HomeSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[600px] bg-slate-900/20" />
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-48 bg-slate-200 rounded-2xl" />)}
      </div>
    </div>
  );
}

function HomePageContent({ content }: { content: HomepageContent }) {
  return (
    <div className="w-full">
      <section className="text-white" style={{ background: `linear-gradient(135deg, var(--header-bg), var(--primary))` }}>
        <div className="mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center" style={{ maxWidth: "var(--container-max)" }}>
          <div>
            <div className="inline-block border px-3 py-1 rounded-full text-xs mb-4 font-bold" style={{ background: "color-mix(in srgb, var(--gold) 20%, transparent)", borderColor: "var(--gold)", color: "var(--gold)" }}>
              {content.hero.kicker}
            </div>
            <h1 className="font-bold leading-tight" style={{ fontSize: "var(--h1-size)" }}>
              {content.hero.title} <span style={{ color: "var(--gold)" }}>{content.hero.highlight}</span>
            </h1>
            <p className="mt-6 text-lg opacity-80">{content.hero.description}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href={content.hero.primaryHref} className="px-8 py-3 font-bold" style={{ background: "var(--gold)", color: "#000", borderRadius: "var(--button-radius)" }}>{content.hero.primaryText}</Link>
              <Link href={content.hero.secondaryHref} className="border border-white px-8 py-3" style={{ borderRadius: "var(--button-radius)" }}>{content.hero.secondaryText}</Link>
            </div>
          </div>
          <div className="p-8 shadow-2xl" style={{ background: "var(--card-bg)", borderRadius: "var(--radius)", color: "var(--foreground)" }}>
            {content.hero.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(content.hero.imageUrl)} alt="" className="mb-6 max-h-48 w-full rounded-lg object-cover" />
            ) : (
              <div className="flex justify-center mb-6">
                <Image src="/logo.png" alt="TMG" width={200} height={70} className="h-16 w-auto" />
              </div>
            )}
            <h3 className="font-bold text-xl">{content.quickCard.title}</h3>
            <p className="text-sm mt-2 mb-6 opacity-70">{content.quickCard.description}</p>
            <Link href={content.quickCard.buttonHref} className="block text-center py-3 font-semibold" style={{ background: "var(--primary)", color: "#fff", borderRadius: "var(--button-radius)" }}>{content.quickCard.buttonText}</Link>
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
              {content.statistics.map((stat) => <div key={`${stat.value}-${stat.label}`} className="p-3 rounded border" style={{ background: "var(--background)", borderColor: "var(--border-color)" }}><strong>{stat.value}</strong> {stat.label}</div>)}
            </div>
          </div>
        </div>
      </section>
      <PublishedMediaSection location="homepage" title="From our work" />
      <section className="mx-auto px-6 py-16" style={{ maxWidth: "var(--container-max)" }}>
        <div className="text-center max-w-3xl mx-auto">
          <p className="font-semibold uppercase tracking-[0.2em] text-xs" style={{ color: "var(--gold)" }}>Our Services</p>
          <h2 className="font-bold mt-3" style={{ fontSize: "var(--h1-size)" }}>{content.services.heading}</h2>
        </div>
        <div className="mt-10 grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {content.services.cards.map((service) => (
            <div key={service.title} className="p-6 shadow-sm hover:shadow-lg transition" style={{ background: "var(--card-bg)", borderColor: "var(--border-color)", borderWidth: "var(--border-width)", borderRadius: "var(--radius)" }}>
              <div className="font-bold text-sm uppercase tracking-wide" style={{ color: "var(--gold)" }}>TMG</div>
              <h3 className="mt-4 font-bold">{service.title}</h3>
              <p className="mt-3 opacity-70">{service.description}</p>
            </div>
          ))}
        </div>
      </section>
      <section style={{ background: "var(--background)" }}>
        <div className="mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center" style={{ maxWidth: "var(--container-max)" }}>
          <div>
            <p className="uppercase tracking-[0.2em] text-xs font-semibold" style={{ color: "var(--gold)" }}>About TMG</p>
            <h2 className="font-bold mt-3" style={{ fontSize: "var(--h1-size)" }}>{content.about.title}</h2>
            <p className="mt-5 leading-7 opacity-70">{content.about.description}</p>
            <div className="mt-8 space-y-4">
              {content.about.reasons.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-black" style={{ background: "var(--gold)" }}>✓</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="p-8 text-white shadow-xl" style={{ background: "var(--primary)", borderRadius: "24px" }}>
            <h3 className="font-bold">{content.about.asideTitle}</h3>
            <ul className="mt-6 space-y-4 opacity-80">
              {content.about.asideItems.map((item) => <li key={item}>• {item}</li>)}
            </ul>
            <Link href="/about" className="mt-8 inline-block px-6 py-3 font-bold" style={{ background: "var(--gold)", color: "#000", borderRadius: "var(--button-radius)" }}>Learn more</Link>
          </div>
        </div>
      </section>
      <section className="text-white py-16" style={{ background: "var(--primary)" }}>
        <div className="mx-auto px-6 text-center" style={{ maxWidth: "var(--container-max)" }}>
          <h2 className="font-bold" style={{ fontSize: "var(--h1-size)" }}>{content.cta.heading}</h2>
          <p className="mt-4 opacity-70">{content.cta.description}</p>
          <div className="mt-8 flex justify-center flex-wrap gap-4">
            <Link href={content.cta.primaryHref} className="px-8 py-3 font-bold" style={{ background: "var(--gold)", color: "#000", borderRadius: "var(--button-radius)" }}>{content.cta.primaryText}</Link>
            <Link href={content.cta.secondaryHref} className="border border-white px-8 py-3" style={{ borderRadius: "var(--button-radius)" }}>{content.cta.secondaryText}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}