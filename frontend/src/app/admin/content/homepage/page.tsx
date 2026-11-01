"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest, type CmsMedia } from "@/lib/content-management";
import AdminMediaPreview from "@/components/admin-media-preview";
import { defaultHomepageContent, mergeHomepageContent, type HomepageContent, type ServiceCard } from "@/lib/homepage-content";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function parseRows(value: string, keys: string[]): Array<Record<string, string>> {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const values = line.split("|").map((item) => item.trim());
    return Object.fromEntries(keys.map((key, index) => [key, values[index] ?? ""]));
  });
}

function formatRows(value: unknown, keys: string[]): string {
  if (!Array.isArray(value)) return "";
  return value.map((row) => keys.map((key) => {
    const field = isRecord(row) ? row : {};
    return typeof field?.[key] === "string" ? field[key] : "";
  }).join(" | ")).join("\n");
}

type HomeForm = {
  kicker: string; title: string; highlight: string; heroDescription: string; primaryText: string; primaryHref: string;
  secondaryText: string; secondaryHref: string; heroImage: string; quickTitle: string; quickDescription: string;
  quickButtonText: string; quickButtonHref: string; servicesHeading: string; services: string; aboutTitle: string;
  aboutDescription: string; reasons: string; asideTitle: string; asideItems: string; testimonialsHeading: string; testimonialsSubheading: string;
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
    testimonialsSubheading: value.testimonials.subheading || "Trusted by founders and SMEs",
    testimonials: value.testimonials.items.map((item, index) => {
      const legacy: Record<string, unknown> = item;
      return {
        id: typeof legacy.id === "string" && legacy.id ? legacy.id : `legacy-${index}`,
        quote: typeof legacy.quote === "string" ? legacy.quote : "",
        clientName: typeof legacy.clientName === "string" ? legacy.clientName
          : typeof legacy.author === "string" ? legacy.author
            : typeof legacy.name === "string" ? legacy.name : "",
        company: typeof legacy.company === "string" ? legacy.company : typeof legacy.role === "string" ? legacy.role : "",
        photoUrl: typeof legacy.photoUrl === "string" ? legacy.photoUrl : "",
        rating: typeof legacy.rating === "number" && Number.isInteger(legacy.rating) && legacy.rating >= 1 && legacy.rating <= 5 ? legacy.rating : 5,
        approved: legacy.approved !== false,
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
    ...defaultHomepageContent,
    hero: {
      kicker: form.kicker, title: form.title, highlight: form.highlight, description: form.heroDescription,
      primaryText: form.primaryText, primaryHref: form.primaryHref, secondaryText: form.secondaryText,
      secondaryHref: form.secondaryHref, imageUrl: form.heroImage,
    },
    quickCard: { title: form.quickTitle, description: form.quickDescription, buttonText: form.quickButtonText, buttonHref: form.quickButtonHref },
    services: {
      heading: form.servicesHeading,
      cards: parseRows(form.services, ["title", "description"]).map((row): ServiceCard => ({
        title: row.title ?? "",
        description: row.description ?? "",
      })),
    },
    about: {
      title: form.aboutTitle, description: form.aboutDescription,
      reasons: form.reasons.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
      asideTitle: form.asideTitle, asideItems: form.asideItems.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
    },
    testimonials: { heading: form.testimonialsHeading, subheading: form.testimonialsSubheading, items: form.testimonials },
    statistics: parseRows(form.statistics, ["value", "label"]).map(row => ({ value: row.value ?? "", label: row.label ?? "" })),
    caseStudies: parseRows(form.caseStudies, ["title", "description"]).map(row => ({ title: row.title ?? "", description: row.description ?? "" })),
    faq: parseRows(form.faq, ["question", "answer"]).map(row => ({ question: row.question ?? "", answer: row.answer ?? "" })),
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      const accessToken = sessionStorage.getItem("accessToken") || localStorage.getItem("token") || "";
      if (!accessToken) throw new Error("Sign in with admin account first. Go to /admin");
      setToken(accessToken);
      const [nextMedia, value] = await Promise.all([
        apiRequest<CmsMedia[]>("/admin/content/media?type=image/", accessToken),
        apiRequest<HomepageContent | null>("/admin/content/settings/homepage", accessToken),
      ]);
      if (!active) return;
      setMedia(nextMedia);
      if (value) setForm(toForm(mergeHomepageContent(value)));
    };
    void Promise.resolve()
      .then(initialize)
      .catch((error: unknown) => { if (active) setError(getErrorMessage(error, "Could not load homepage content.")); });
    return () => { active = false; };
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      await apiRequest("/admin/content/settings/homepage", token, { method: "PUT", body: JSON.stringify({ value: toContent(form) }) });
      setNotice("✅ Homepage + Testimonials saved! Refresh homepage in 30 sec to see.");
    } catch (cause: unknown) { setError(getErrorMessage(cause, "Save failed")); } finally { setSaving(false); }
  }

  function field(key: StringHomeFormKey, label: string, options: { multiline?: boolean; url?: boolean } = {}) {
    const Input = options.multiline ? "textarea" : "input";
    return <label key={key} className="block text-sm font-medium">{label}<Input {...(options.multiline ? { rows: 3 } : { type: "text", ...(options.url ? { inputMode: "url" as const } : {}) })} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2" /></label>;
  }

  function rows(key: StringHomeFormKey, label: string, example: string) {
    return <label key={key} className="block text-sm font-medium">{label}<textarea rows={5} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 p-2 font-mono text-sm" /><span className="mt-1 block text-xs text-slate-500">One per line: {example}</span></label>;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Content Management</p><h1 className="mt-2 text-4xl font-bold">Homepage + Testimonials</h1></div><Link href="/admin/content" className="rounded-md border px-4 py-2 font-semibold">Content menu</Link></div>
      {(error || notice) && <p className={`mt-6 rounded-lg p-4 text-sm ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{error || notice}</p>}
      <form onSubmit={save} className="mt-8 space-y-8 rounded-2xl border bg-white p-6 shadow-sm">
        <section className="grid gap-4 md:grid-cols-2"><h2 className="text-xl font-bold md:col-span-2">Hero</h2>{field("kicker", "Kicker")}{field("title", "Heading")}{field("highlight", "Highlight")}{field("heroDescription", "Description", { multiline: true })}{field("primaryText", "Primary label")}{field("primaryHref", "Primary URL", { url: true })}{field("secondaryText", "Secondary label")}{field("secondaryHref", "Secondary URL", { url: true })}
          <label className="block text-sm font-medium md:col-span-2">Hero image
            <input value={mediaSearch} onChange={(e) => setMediaSearch(e.target.value)} placeholder="Search images" className="mt-1 block w-full rounded border p-2" />
            <select value={form.heroImage} onChange={(e) => setForm({ ...form, heroImage: e.target.value })} className="mt-2 block w-full rounded border p-2">
              <option value="">Default logo</option>
              {media.filter(m => m.originalName.toLowerCase().includes(mediaSearch.toLowerCase())).map((item) => <option key={item.id} value={item.url}>{item.originalName}</option>)}
            </select>
            {form.heroImage && <div className="mt-3 max-w-md"><AdminMediaPreview url={form.heroImage} token={token} contentType="image/*" alt="hero" className="max-h-48 w-full rounded object-contain" /></div>}
          </label>
        </section>
        <section className="grid gap-4 border-t pt-6 md:grid-cols-2"><h2 className="text-xl font-bold md:col-span-2">Quick card</h2>{field("quickTitle", "Title")}{field("quickDescription", "Desc", { multiline: true })}{field("quickButtonText", "Button")}{field("quickButtonHref", "URL", { url: true })}</section>
        <section className="grid gap-4 border-t pt-6 md:grid-cols-2"><h2 className="text-xl font-bold md:col-span-2">Services</h2>{field("servicesHeading", "Heading")}{rows("services", "Cards", "title | description")}</section>
        <section className="grid gap-4 border-t pt-6 md:grid-cols-2"><h2 className="text-xl font-bold md:col-span-2">About</h2>{field("aboutTitle", "Title")}{field("aboutDescription", "Desc", { multiline: true })}{rows("reasons", "Reasons", "one reason")}{field("asideTitle", "Side title")}{rows("asideItems", "Side points", "one point")}</section>

        <section className="grid gap-4 border-t pt-6">
          <h2 className="text-xl font-bold">Testimonials</h2>
          {field("testimonialsHeading", "Heading")}{field("testimonialsSubheading", "Subheading")}
          <div className="space-y-4">
            <div className="flex justify-between"><h3 className="font-semibold">Client Reviews ({form.testimonials.length})</h3><button type="button" onClick={() => setForm({ ...form, testimonials: [...form.testimonials, { id: crypto.randomUUID(), quote: "", clientName: "", company: "", photoUrl: "", rating: 5, approved: true }] })} className="rounded border px-3 py-2 text-sm font-semibold">+ Add</button></div>
            <p className="text-sm text-slate-600">⚠️ Check Approved to show on homepage. Unchecked = hidden.</p>
            {form.testimonials.map((item, idx) => (
              <fieldset key={item.id} className="grid gap-3 rounded-xl border p-4 md:grid-cols-2">
                <legend className="px-1 text-sm font-semibold">Review {idx + 1}</legend>
                <label className="text-sm font-medium md:col-span-2">Quote<textarea required maxLength={2000} rows={3} value={item.quote} onChange={(e) => setForm({ ...form, testimonials: form.testimonials.map(c => c.id === item.id ? { ...c, quote: e.target.value } : c) })} className="mt-1 block w-full rounded border p-2" /></label>
                <label className="text-sm font-medium">Client<input value={item.clientName} onChange={(e) => setForm({ ...form, testimonials: form.testimonials.map(c => c.id === item.id ? { ...c, clientName: e.target.value } : c) })} className="mt-1 block w-full rounded border p-2" /></label>
                <label className="text-sm font-medium">Company<input value={item.company} onChange={(e) => setForm({ ...form, testimonials: form.testimonials.map(c => c.id === item.id ? { ...c, company: e.target.value } : c) })} className="mt-1 block w-full rounded border p-2" /></label>
                <label className="text-sm font-medium">Photo URL<input value={item.photoUrl} onChange={(e) => setForm({ ...form, testimonials: form.testimonials.map(c => c.id === item.id ? { ...c, photoUrl: e.target.value } : c) })} className="mt-1 block w-full rounded border p-2" /></label>
                <label className="text-sm font-medium">Rating<select value={item.rating} onChange={(e) => setForm({ ...form, testimonials: form.testimonials.map(c => c.id === item.id ? { ...c, rating: Number(e.target.value) } : c) })} className="mt-1 block w-full rounded border p-2"><option value={5}>5 ★</option><option value={4}>4 ★</option><option value={3}>3 ★</option></select></label>
                <div className="flex justify-between md:col-span-2"><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={item.approved} onChange={(e) => setForm({ ...form, testimonials: form.testimonials.map(c => c.id === item.id ? { ...c, approved: e.target.checked } : c) })} /> Approved - Show on homepage</label><button type="button" onClick={() => setForm({ ...form, testimonials: form.testimonials.filter(c => c.id !== item.id) })} className="text-sm text-red-700 underline">Remove</button></div>
              </fieldset>
            ))}
          </div>
          {rows("statistics", "Metrics", "12 | Projects")}
        </section>

        <section className="grid gap-4 border-t pt-6 md:grid-cols-2"><h2 className="text-xl font-bold md:col-span-2">FAQ & CTA</h2>{rows("caseStudies", "Case studies", "title | desc")}{rows("faq", "FAQs", "q | a")}{field("ctaHeading", "CTA Heading")}{field("ctaDescription", "CTA Desc", { multiline: true })}{field("ctaPrimaryText", "Primary")}{field("ctaPrimaryHref", "URL", { url: true })}{field("ctaSecondaryText", "Secondary")}{field("ctaSecondaryHref", "URL", { url: true })}</section>
        <button type="submit" disabled={!token || saving} className="rounded bg-[#0F172A] px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save Homepage + Testimonials"}</button>
      </form>
    </main>
  );
}
