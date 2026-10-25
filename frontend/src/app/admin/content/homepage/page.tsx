"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest, type CmsMedia } from "@/lib/content-management";
import AdminMediaPreview from "@/components/admin-media-preview";
import { defaultHomepageContent, type HomepageContent } from "@/lib/homepage-content";

function parseRows(value: string, keys: string[]): Array<Record<string, string>> {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const values = line.split("|").map((item) => item.trim());
    return Object.fromEntries(keys.map((key, index) => [key, values[index] ?? ""]));
  });
}

function formatRows(value: unknown, keys: string[]): string {
  if (!Array.isArray(value)) return "";
  return value.map((row) => keys.map((key) => {
    const field = row as Record<string, unknown>;
    return typeof field?.[key] === "string" ? field[key] : "";
  }).join(" | ")).join("\n");
}

type HomeForm = {
  kicker: string; title: string; highlight: string; heroDescription: string; primaryText: string; primaryHref: string;
  secondaryText: string; secondaryHref: string; heroImage: string; quickTitle: string; quickDescription: string;
  quickButtonText: string; quickButtonHref: string; servicesHeading: string; services: string; aboutTitle: string;
  aboutDescription: string; reasons: string; asideTitle: string; asideItems: string; testimonialsHeading: string;
  testimonials: HomepageContent["testimonials"]["items"]; statistics: string; caseStudies: string; faq: string; ctaHeading: string;
  ctaDescription: string; ctaPrimaryText: string; ctaPrimaryHref: string; ctaSecondaryText: string; ctaSecondaryHref: string;
};

type StringHomeFormKey = {
  [Key in keyof HomeForm]: HomeForm[Key] extends string ? Key : never;
}[keyof HomeForm];

function toForm(value: HomepageContent): HomeForm {
  return {
    kicker: value.hero.kicker, title: value.hero.title, highlight: value.hero.highlight,
    heroDescription: value.hero.description, primaryText: value.hero.primaryText, primaryHref: value.hero.primaryHref,
    secondaryText: value.hero.secondaryText, secondaryHref: value.hero.secondaryHref, heroImage: value.hero.imageUrl,
    quickTitle: value.quickCard.title, quickDescription: value.quickCard.description,
    quickButtonText: value.quickCard.buttonText, quickButtonHref: value.quickCard.buttonHref,
    servicesHeading: value.services.heading, services: formatRows(value.services.cards, ["title", "description"]),
    aboutTitle: value.about.title, aboutDescription: value.about.description, reasons: value.about.reasons.join("\n"),
    asideTitle: value.about.asideTitle, asideItems: value.about.asideItems.join("\n"),
    testimonialsHeading: value.testimonials.heading,
    testimonials: value.testimonials.items.map((item, index) => {
      const legacy = item as HomepageContent["testimonials"]["items"][number] & { author?: string };
      return {
        id: legacy.id || `legacy-${index}`,
        quote: legacy.quote || "",
        clientName: legacy.clientName || legacy.author || "",
        company: legacy.company || "",
        photoUrl: legacy.photoUrl || "",
        rating: Number.isInteger(legacy.rating) && legacy.rating >= 1 && legacy.rating <= 5 ? legacy.rating : 5,
        approved: legacy.approved === true,
      };
    }),
    statistics: formatRows(value.statistics, ["value", "label"]),
    caseStudies: formatRows(value.caseStudies, ["title", "description"]),
    faq: formatRows(value.faq, ["question", "answer"]), ctaHeading: value.cta.heading,
    ctaDescription: value.cta.description, ctaPrimaryText: value.cta.primaryText, ctaPrimaryHref: value.cta.primaryHref,
    ctaSecondaryText: value.cta.secondaryText, ctaSecondaryHref: value.cta.secondaryHref,
  };
}

function toContent(form: HomeForm): HomepageContent {
  return {
    hero: {
      kicker: form.kicker, title: form.title, highlight: form.highlight, description: form.heroDescription,
      primaryText: form.primaryText, primaryHref: form.primaryHref, secondaryText: form.secondaryText,
      secondaryHref: form.secondaryHref, imageUrl: form.heroImage,
    },
    quickCard: { title: form.quickTitle, description: form.quickDescription, buttonText: form.quickButtonText, buttonHref: form.quickButtonHref },
    services: { heading: form.servicesHeading, cards: parseRows(form.services, ["title", "description"]) as HomepageContent["services"]["cards"] },
    about: {
      title: form.aboutTitle, description: form.aboutDescription,
      reasons: form.reasons.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
      asideTitle: form.asideTitle, asideItems: form.asideItems.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
    },
    testimonials: { heading: form.testimonialsHeading, items: form.testimonials },
    statistics: parseRows(form.statistics, ["value", "label"]) as HomepageContent["statistics"],
    caseStudies: parseRows(form.caseStudies, ["title", "description"]) as HomepageContent["caseStudies"],
    faq: parseRows(form.faq, ["question", "answer"]) as HomepageContent["faq"],
    cta: {
      heading: form.ctaHeading, description: form.ctaDescription, primaryText: form.ctaPrimaryText,
      primaryHref: form.ctaPrimaryHref, secondaryText: form.ctaSecondaryText, secondaryHref: form.ctaSecondaryHref,
    },
  };
}

export default function HomepageContentPage() {
  const [token, setToken] = useState("");
  const [media, setMedia] = useState<CmsMedia[]>([]);
  const [mediaSearch, setMediaSearch] = useState("");
  const [form, setForm] = useState<HomeForm>(() => toForm(defaultHomepageContent));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const accessToken = sessionStorage.getItem("accessToken");
      if (!accessToken) {
        setError("Sign in with an administrator account to edit homepage content.");
        return;
      }
      setToken(accessToken);
      void apiRequest<CmsMedia[]>("/admin/content/media?type=image/", accessToken)
        .then(setMedia)
        .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load homepage image options."));
      void apiRequest<HomepageContent | null>("/admin/content/settings/homepage", accessToken)
        .then((value) => {
          if (value) {
            setForm(toForm({
              ...defaultHomepageContent,
              ...value,
              hero: { ...defaultHomepageContent.hero, ...value.hero },
              quickCard: { ...defaultHomepageContent.quickCard, ...value.quickCard },
              services: { ...defaultHomepageContent.services, ...value.services },
              about: { ...defaultHomepageContent.about, ...value.about },
              testimonials: {
                ...defaultHomepageContent.testimonials,
                ...value.testimonials,
                items: value.testimonials?.items ?? defaultHomepageContent.testimonials.items,
              },
              cta: { ...defaultHomepageContent.cta, ...value.cta },
            }));
          }
        })
        .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load homepage content."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await apiRequest("/admin/content/settings/homepage", token, {
        method: "PUT",
        body: JSON.stringify({ value: toContent(form) }),
      });
      setNotice("Homepage content saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save homepage content.");
    }
  }

  function field(key: StringHomeFormKey, label: string, options: { multiline?: boolean; url?: boolean } = {}) {
    const Input = options.multiline ? "textarea" : "input";
    return <label key={key} className="block text-sm font-medium">{label}
      <Input
        {...(options.multiline ? { rows: 3 } : { type: "text", ...(options.url ? { inputMode: "url" as const } : {}) })}
        value={form[key]}
        onChange={(event) => setForm({ ...form, [key]: event.target.value })}
        className="mt-1 block w-full rounded-md border border-slate-300 p-2"
      />
    </label>;
  }

  function rows(key: StringHomeFormKey, label: string, example: string) {
    return <label key={key} className="block text-sm font-medium">{label}
      <textarea rows={5} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2 font-mono text-sm" />
      <span className="mt-1 block text-xs font-normal text-slate-500">One item per line: {example}</span>
    </label>;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Content Management</p><h1 className="mt-2 text-4xl font-bold">Homepage Content</h1><p className="mt-3 text-slate-600">Edit the public homepage without changing application code.</p></div><Link href="/admin/content" className="rounded-md border border-slate-300 px-4 py-2 font-semibold">Content menu</Link></div>
      {(error || notice) && <p role={error ? "alert" : "status"} className={`mt-6 rounded-lg p-4 text-sm ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{error || notice}</p>}
      <form onSubmit={(event) => void save(event)} className="mt-8 space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <section className="grid gap-4 md:grid-cols-2"><h2 className="text-xl font-bold md:col-span-2">Hero section</h2>{field("kicker", "Kicker")}{field("title", "Heading")}{field("highlight", "Highlighted heading text")}{field("heroDescription", "Description", { multiline: true })}{field("primaryText", "Primary button label")}{field("primaryHref", "Primary button URL", { url: true })}{field("secondaryText", "Secondary button label")}{field("secondaryHref", "Secondary button URL", { url: true })}
          <label className="block text-sm font-medium md:col-span-2">Select hero image from Media Library
            <input value={mediaSearch} onChange={(event) => setMediaSearch(event.target.value)} placeholder="Search published homepage images" className="mt-1 block w-full rounded-md border border-slate-300 p-2" />
            <select value={form.heroImage} onChange={(event) => setForm({ ...form, heroImage: event.target.value })} className="mt-2 block w-full rounded-md border border-slate-300 p-2">
              <option value="">Use the default logo</option>
              {form.heroImage && !media.some((item) => item.url === form.heroImage && item.originalName.toLowerCase().includes(mediaSearch.trim().toLowerCase())) && <option value={form.heroImage}>Current image (not in the filtered list)</option>}
              {media.filter((item) => item.status === "AVAILABLE" && (item.locations ?? []).includes("homepage") && item.originalName.toLowerCase().includes(mediaSearch.trim().toLowerCase())).map((item) => <option key={item.id} value={item.url}>{item.originalName}</option>)}
            </select>
            <span className="mt-1 block text-xs font-normal text-slate-500">Only scanned images published to Homepage are available. “Publish to Homepage” adds images to the From our work section; the hero image is selected here.</span>
            {form.heroImage && <div className="mt-3 max-w-md"><AdminMediaPreview url={form.heroImage} token={token} contentType="image/*" alt="Selected homepage hero" className="max-h-48 w-full rounded-lg object-contain" /></div>}
            <Link href="/admin/content/media" className="mt-2 inline-block text-xs underline">Manage homepage-published images</Link>
          </label>
        </section>
        <section className="grid gap-4 border-t border-slate-200 pt-6 md:grid-cols-2"><h2 className="text-xl font-bold md:col-span-2">Quick-start card</h2>{field("quickTitle", "Card heading")}{field("quickDescription", "Card description", { multiline: true })}{field("quickButtonText", "Button label")}{field("quickButtonHref", "Button URL", { url: true })}</section>
        <section className="grid gap-4 border-t border-slate-200 pt-6 md:grid-cols-2"><h2 className="text-xl font-bold md:col-span-2">Services</h2>{field("servicesHeading", "Section heading", { multiline: true })}{rows("services", "Service cards", "title | description")}</section>
        <section className="grid gap-4 border-t border-slate-200 pt-6 md:grid-cols-2"><h2 className="text-xl font-bold md:col-span-2">About and reasons to choose TMG</h2>{field("aboutTitle", "Heading", { multiline: true })}{field("aboutDescription", "Description", { multiline: true })}{rows("reasons", "Reasons (one per line)", "one reason")}{field("asideTitle", "Side card heading")}{rows("asideItems", "Side card points", "one point")}</section>
        <section className="grid gap-4 border-t border-slate-200 pt-6 md:grid-cols-2">
          <h2 className="text-xl font-bold md:col-span-2">Testimonials and statistics</h2>
          {field("testimonialsHeading", "Testimonials heading", { multiline: true })}
          <div className="space-y-4 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Client testimonials</h3><button type="button" onClick={() => setForm({ ...form, testimonials: [...form.testimonials, { id: crypto.randomUUID(), quote: "", clientName: "", company: "", photoUrl: "", rating: 5, approved: false }] })} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">Add testimonial</button></div>
            <p className="text-sm text-slate-600">Only approved testimonials appear on the public homepage. Confirm client permission and verify claims before approval.</p>
            {form.testimonials.map((item, index) => (
              <fieldset key={item.id} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-2">
                <legend className="px-1 text-sm font-semibold">Testimonial {index + 1}</legend>
                <label className="text-sm font-medium md:col-span-2">Review<textarea required maxLength={2000} rows={3} value={item.quote} onChange={(event) => setForm({ ...form, testimonials: form.testimonials.map((current) => current.id === item.id ? { ...current, quote: event.target.value } : current) })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" /></label>
                <label className="text-sm font-medium">Client name<input maxLength={120} value={item.clientName} onChange={(event) => setForm({ ...form, testimonials: form.testimonials.map((current) => current.id === item.id ? { ...current, clientName: event.target.value } : current) })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" /></label>
                <label className="text-sm font-medium">Company<input maxLength={160} value={item.company} onChange={(event) => setForm({ ...form, testimonials: form.testimonials.map((current) => current.id === item.id ? { ...current, company: event.target.value } : current) })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" /></label>
                <label className="text-sm font-medium">Photo URL (optional)<input type="url" value={item.photoUrl} onChange={(event) => setForm({ ...form, testimonials: form.testimonials.map((current) => current.id === item.id ? { ...current, photoUrl: event.target.value } : current) })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" /></label>
                <label className="text-sm font-medium">Rating
                  <select value={item.rating} onChange={(event) => setForm({ ...form, testimonials: form.testimonials.map((current) => current.id === item.id ? { ...current, rating: Number(event.target.value) } : current) })} className="mt-1 block w-full rounded-md border border-slate-300 p-2">
                    {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} out of 5</option>)}
                  </select>
                </label>
                <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={item.approved} onChange={(event) => setForm({ ...form, testimonials: form.testimonials.map((current) => current.id === item.id ? { ...current, approved: event.target.checked } : current) })} />Approved for public display</label>
                  <button type="button" onClick={() => setForm({ ...form, testimonials: form.testimonials.filter((current) => current.id !== item.id) })} className="text-sm font-semibold text-red-700 underline">Remove</button>
                </div>
              </fieldset>
            ))}
          </div>
          {rows("statistics", "Verified metrics (value | label, one per line)", "12 | Projects completed")}
        </section>
        <section className="grid gap-4 border-t border-slate-200 pt-6 md:grid-cols-2"><h2 className="text-xl font-bold md:col-span-2">Case studies and FAQ</h2>{rows("caseStudies", "Case studies", "title | description")}{rows("faq", "FAQs", "question | answer")}</section>
        <section className="grid gap-4 border-t border-slate-200 pt-6 md:grid-cols-2"><h2 className="text-xl font-bold md:col-span-2">Call to action</h2>{field("ctaHeading", "Heading")}{field("ctaDescription", "Description", { multiline: true })}{field("ctaPrimaryText", "Primary button label")}{field("ctaPrimaryHref", "Primary button URL", { url: true })}{field("ctaSecondaryText", "Secondary button label")}{field("ctaSecondaryHref", "Secondary button URL", { url: true })}</section>
        <button type="submit" disabled={!token} className="rounded-md bg-[#0F172A] px-5 py-3 font-semibold text-white">Save homepage</button>
      </form>
    </main>
  );
}




