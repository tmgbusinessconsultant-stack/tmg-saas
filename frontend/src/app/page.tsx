import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { mediaUrl } from "@/lib/content-management";
import { defaultHomepageContent, type HomepageContent } from "@/lib/homepage-content";
import PublishedMediaSection from "@/components/published-media-section";

async function loadHomepageContent(): Promise<HomepageContent> {
  const base = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!base) return defaultHomepageContent;
  const response = await fetch(`${base}/content/homepage`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load homepage content (${response.status}).`);
  const body = await response.text();
  if (!body.trim()) return defaultHomepageContent;
  let value: Partial<HomepageContent> | null;
  try {
    value = JSON.parse(body) as Partial<HomepageContent> | null;
  } catch (cause) {
    throw new Error("Homepage content response was not valid JSON.", { cause });
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
            <p className="mt-6 text-gray-300 text-lg">
              {content.hero.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href={content.hero.primaryHref} className="bg-[#D4AF37] text-black px-8 py-3 rounded-md font-bold hover:bg-white transition">
                {content.hero.primaryText}
              </Link>
              <Link href={content.hero.secondaryHref} className="border border-white px-8 py-3 rounded-md hover:bg-white hover:text-black transition">
                {content.hero.secondaryText}
              </Link>
            </div>
            <div className="mt-8 flex gap-6 text-sm text-gray-400 flex-wrap">
              <span>✓ AI Tools</span>
              <span>✓ Consulting</span>
              <span>✓ Training</span>
              <span>✓ Digital Products</span>
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
            <Link href={content.quickCard.buttonHref} className="block text-center bg-[#0F172A] text-white py-3 rounded-md font-semibold hover:bg-[#D4AF37] hover:text-black transition">
              {content.quickCard.buttonText}
            </Link>
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
              {content.statistics.map((stat) => <div key={`${stat.value}-${stat.label}`} className="bg-[#F8FAFC] p-3 rounded border"><strong>{stat.value}</strong> {stat.label}</div>)}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="search-center-heading" className="mx-auto -mt-1 max-w-5xl px-6 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">AI · Training · Growth</p>
          <h2 id="search-center-heading" className="mt-2 text-center text-2xl font-bold sm:text-3xl">Find the right support for your business</h2>
          <form action="/search" method="get" className="mx-auto mt-6 flex max-w-3xl flex-col gap-3 sm:flex-row">
            <label htmlFor="homepage-search" className="sr-only">Search our services and insights</label>
            <input id="homepage-search" name="q" type="search" minLength={2} maxLength={120} placeholder="Search services, insights, training…" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3" />
            <button type="submit" className="rounded-lg bg-[#D4AF37] px-6 py-3 font-bold text-[#0F172A]">Search</button>
          </form>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/ai" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">Ask TMG AI</Link>
            <Link href="/upload" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">Upload a project file</Link>
            <Link href="/quote" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">Request a quote</Link>
          </div>
          <p className="mt-5 text-center text-sm text-slate-600">Trusted business consulting, automation and data solutions for organizations worldwide.</p>
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
            <p className="mt-5 text-slate-600 leading-7">
              {content.about.description}
            </p>
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
              <div className="text-amber-600" aria-label={`${item.rating} out of 5 stars`} title={`${item.rating} out of 5 stars`}>{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</div>
              <p className="mt-3 leading-7 text-slate-700">“{item.quote}”</p>
              <div className="mt-6 font-semibold text-[#0F172A]">{item.clientName}{item.company ? `, ${item.company}` : ""}</div>
            </div>
          ))}
        </div>
      </section>}

      {content.caseStudies.length > 0 && <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center"><p className="text-[#8A6A00] text-xs font-semibold uppercase tracking-[0.2em]">Selected work</p><h2 className="mt-3 text-3xl font-bold">Case studies</h2></div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">{content.caseStudies.map((item) => <article key={item.title} className="rounded-xl border border-slate-200 bg-white p-6"><h3 className="text-xl font-bold">{item.title}</h3><p className="mt-3 text-slate-600">{item.description}</p></article>)}</div>
      </section>}

      {content.faq.length > 0 && <section id="faq" className="bg-slate-100 py-16">
        <div className="mx-auto max-w-4xl px-6"><p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">FAQ</p><h2 className="mt-3 text-center text-3xl font-bold">Frequently asked questions</h2>
          <div className="mt-8 space-y-4">{content.faq.map((item) => <details key={item.question} className="rounded-xl bg-white p-5"><summary className="cursor-pointer font-semibold">{item.question}</summary><p className="mt-3 leading-7 text-slate-600">{item.answer}</p></details>)}</div>
        </div>
      </section>}

      <section aria-labelledby="growth-journey-heading" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">A clear next step</p>
          <h2 id="growth-journey-heading" className="mt-3 text-3xl font-bold sm:text-4xl">How TMG helps you grow</h2>
          <p className="mt-4 text-slate-600">Move from a business question to a practical consulting engagement with a secure, supported process.</p>
        </div>
        <ol className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {["Search for relevant services and insights", "Ask TMG AI for general guidance", "Upload project files in your secure client portal", "Discuss your goals with a consultant", "Receive a reviewed quote and scope", "Track project work and deliverables"].map((step, index) => (
            <li key={step} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF4C2] font-bold text-[#624B00]">{index + 1}</span>
              <span className="pt-1 font-medium">{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/ai" className="rounded-md bg-[#0F172A] px-5 py-3 font-semibold text-white">Try AI Assistant</Link>
          <Link href="/upload" className="rounded-md border border-slate-300 px-5 py-3 font-semibold">Upload Project Files</Link>
          <Link href="/quote" className="rounded-md bg-[#D4AF37] px-5 py-3 font-semibold text-black">Request Quote</Link>
          <Link href="/booking" className="rounded-md border border-slate-300 px-5 py-3 font-semibold">Book Consultation</Link>
        </div>
      </section>

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