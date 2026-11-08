/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { Config } from "@measured/puck";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function parseItems<T>(json: string, isItem: (v: unknown) => v is T) {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return { items: [] as T[], error: "Expected a JSON array." };
    if (!parsed.every(isItem)) return { items: [] as T[], error: "One item has invalid format." };
    return { items: parsed as T[], error: null as string | null };
  } catch (e: any) { return { items: [] as T[], error: e.message || "Invalid JSON." }; }
}
function safeHref(href: string) {
  const t = href.trim();
  return t.startsWith("/") || t.startsWith("#") || /^https?:\/\//i.test(t) ? t : "#";
}
function hexToRgba(hex: string, opacity: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const r = parseInt(full.substring(0, 2), 16) || 15;
  const g = parseInt(full.substring(2, 4), 16) || 23;
  const b = parseInt(full.substring(4, 6), 16) || 42;
  return `rgba(${r},${g},${b},${opacity})`;
}

export interface RootProps { siteName: string; headerBg: string; headerColor: string; footerBg: string; footerColor: string; bg: string; }
interface CardItem { title: string; desc: string; icon: string; }
const isCard = (v: unknown): v is CardItem => isRecord(v) && typeof v.title === "string" && typeof v.desc === "string" && typeof v.icon === "string";
const isStat = (v: unknown): v is { label: string; val: string } => isRecord(v) && typeof v.label === "string" && typeof v.val === "string";

const WhatsAppBlock = ({ phone, message, label }: any) => {
  const clean = (phone || "").replace(/[^0-9]/g, "");
  if (!clean) return <div className="p-8 border-2 border-dashed rounded-xl text-center text-gray-400">Add WhatsApp number in block settings</div>;
  const href = `https://wa.me/${clean}?text=${encodeURIComponent(message || "Hi, I want to enquire")}`;
  return <div className="flex justify-center py-4"><a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1eb856] text-white px-6 py-3 rounded-full font-bold shadow-lg">💬 {label || "Chat on WhatsApp"}</a></div>;
};
const FormRenderer = ({ formId, title, bg }: any) => {
  const [form, setForm] = useState<any>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!formId) { setLoading(false); return; }
    fetch(`/api/forms/${formId}`).then(r => r.json()).then(f => { setForm(f); setLoading(false); }).catch(() => setLoading(false));
  }, [formId]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await fetch(`/api/forms/${formId}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: values }) }); setDone(true); }
    catch { alert('Failed'); }
  };
  if (!formId) return <div className="p-8 border-2 border-dashed rounded-xl text-center text-gray-400">Select a Form ID in sidebar</div>;
  if (loading) return <div className="p-6 animate-pulse">Loading form...</div>;
  if (done) return <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-center text-green-800">{form?.settings?.successMessage || "Thank you! Submitted successfully"}</div>;
  if (!form) return <div className="p-6 text-red-500">Form not found: {formId}</div>;
  return (
    <div style={{ background: bg || '#fff' }} className="py-10 px-4">
      <form onSubmit={submit} className="space-y-4 max-w-2xl mx-auto bg-white border rounded-2xl p-8 shadow-sm">
        <h3 className="text-2xl font-bold">{title || form.name}</h3>
        {(form.fields || []).map((f: any) => (
          <div key={f.id} className="space-y-1">
            <label className="text-sm font-medium">{f.label} {f.required && <span className="text-red-500">*</span>}</label>
            {f.type === 'textarea' ? <textarea required={f.required} placeholder={f.placeholder} className="w-full border rounded-lg p-3" value={values[f.id] || ''} onChange={e => setValues({ ...values, [f.id]: e.target.value })} />
            : f.type === 'select' ? <select required={f.required} className="w-full border rounded-lg p-3 bg-white" value={values[f.id] || ''} onChange={e => setValues({ ...values, [f.id]: e.target.value })}><option value="">Select...</option>{(f.options || []).map((o: string) => <option key={o} value={o}>{o}</option>)}</select>
            : <input type={f.type === 'phone' ? 'tel' : f.type} required={f.required} placeholder={f.placeholder} className="w-full border rounded-lg p-3" value={values[f.id] || ''} onChange={e => setValues({ ...values, [f.id]: e.target.value })} />}
          </div>
        ))}
        <button className="w-full bg-black text-white py-3 rounded-lg font-bold">{form.settings?.submitText || 'Submit'}</button>
      </form>
    </div>
  );
};

const EmbedRenderer = ({ url, height }: any) => {
  if (!url) return <div className="p-8 border-2 border-dashed rounded-xl text-center text-gray-400">Paste Google Form / YouTube / URL in sidebar</div>;
  return <div className="w-full my-6 overflow-hidden rounded-2xl border shadow-sm bg-white"><iframe src={url} width="100%" height={height || 600} style={{ border: 0 }} loading="lazy" title="Embedded content" /></div>;
};

export const config: Config<any, RootProps> = {
  root: {
    fields: {
      siteName: { type: "text", label: "Brand Name" },
      bg: { type: "text", label: "Page Background" },
      headerBg: { type: "text", label: "Header Background" },
      headerColor: { type: "text", label: "Header Text Color" },
      footerBg: { type: "text", label: "Footer Background" },
      footerColor: { type: "text", label: "Footer Text Color" },
    },
    defaultProps: { siteName: "VONIX", bg: "#ffffff", headerBg: "#ffffff", headerColor: "#0a2540", footerBg: "#0a2540", footerColor: "#ffffff" },
    render: ({ children, bg }: any) => <div style={{ backgroundColor: bg || '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif' }}>{children}</div>,
  },
  components: {
    Heading: {
      fields: {
        text: { type: "text", label: "Text" },
        level: { type: "select", options: [{ label: "H1 Hero", value: "h1" }, { label: "H2 Section", value: "h2" }, { label: "H3 Sub", value: "h3" }] },
        color: { type: "text", label: "Color" },
        align: { type: "radio", options: [{ label: "Left", value: "left" }, { label: "Center", value: "center" }, { label: "Right", value: "right" }] },
      },
      defaultProps: { text: "We help businesses grow in Qatar", level: "h1", color: "#0a2540", align: "left" },
      render: ({ text, level, color, align }: any) => {
        const style = { color, textAlign: align };
        if (level === "h2") return <h2 style={style} className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">{text}</h2>;
        if (level === "h3") return <h3 style={style} className="text-xl md:text-2xl font-semibold mb-2">{text}</h3>;
        return <h1 style={style} className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">{text}</h1>;
      },
    },
    Text: {
      fields: {
        text: { type: "textarea", label: "Body Text" },
        color: { type: "text", label: "Color" },
        align: { type: "radio", options: [{ label: "Left", value: "left" }, { label: "Center", value: "center" }, { label: "Right", value: "right" }] },
      },
      defaultProps: { text: "VONIX helps entrepreneurs start and grow in Qatar.", color: "#4a5568", align: "left" },
      render: ({ text, color, align }: any) => <p style={{ color, textAlign: align }} className="text-base md:text-lg max-w-3xl leading-relaxed mb-4 whitespace-pre-wrap">{text}</p>,
    },
    Button: {
      fields: {
        text: { type: "text", label: "Label" },
        link: { type: "text", label: "Link" },
        bg: { type: "text", label: "Background" },
        variant: { type: "select", options: [{ label: "Solid", value: "solid" }, { label: "Outline", value: "outline" }] },
        align: { type: "radio", options: [{ label: "Left", value: "left" }, { label: "Center", value: "center" }, { label: "Right", value: "right" }] },
      },
      defaultProps: { text: "Get Free Consultation", link: "/contact", bg: "#0a2540", variant: "solid", align: "left" },
      render: ({ text, link, bg, variant, align }: any) => (
        <div style={{ textAlign: align }} className="my-2">
          <a href={safeHref(link)} style={variant === 'solid' ? { background: bg } : { borderColor: bg, color: bg }} className={`px-8 py-3.5 rounded-xl inline-block font-semibold shadow-sm hover:scale-[1.02] transition text-sm md:text-base ${variant === 'solid' ? 'text-white' : 'border-2 bg-transparent'}`}>{text}</a>
        </div>
      ),
    },
    Image: {
      fields: {
        url: { type: "text", label: "Image URL" },
        alt: { type: "text", label: "Alt Text (SEO)" },
        aspectRatio: { type: "select", options: [{ label: "Auto", value: "auto" }, { label: "Square 1:1", value: "square" }, { label: "Video 16:9", value: "video" }] },
        mask: { type: "select", label: "Mask Shape", options: [{ label: "None", value: "none" }, { label: "Rounded", value: "rounded" }, { label: "Arch", value: "arch" }, { label: "Circle", value: "circle" }, { label: "Blob", value: "blob" }] },
        borderWidth: { type: "select", label: "Border Width", options: [{ label: "None", value: "0" }, { label: "1px", value: "1" }, { label: "2px", value: "2" }, { label: "4px", value: "4" }] },
        borderColor: { type: "text", label: "Border Color" },
      },
      defaultProps: { url: "https://images.unsplash.com/photo-1497366216548-37526070297c", alt: "Modern Office", aspectRatio: "auto", mask: "none", borderWidth: "0", borderColor: "#0a2540" },
      render: ({ url, alt, aspectRatio, mask, borderWidth, borderColor }: any) => {
        const cls = aspectRatio === 'square' ? 'aspect-square object-cover' : aspectRatio === 'video' ? 'aspect-video object-cover' : 'w-full h-auto';
        const radius = mask === "arch" ? "999px 999px 24px 24px" : mask === "circle" ? "50%" : mask === "blob" ? "60% 40% 30% 70% / 60% 30% 70% 40%" : mask === "rounded" ? "24px" : "16px";
        const border = borderWidth !== "0" ? `${borderWidth}px solid ${borderColor}` : undefined;
        return <div className="w-full my-4 overflow-hidden shadow-md" style={{ borderRadius: radius, border }}><img src={url} alt={alt} className={`${cls} hover:scale-105 transition duration-500`} style={{ borderRadius: radius }} /></div>;
      },
    },
    Hero: {
      fields: {
        title: { type: "text" }, subtitle: { type: "textarea" },
        ctaText: { type: "text" }, ctaLink: { type: "text" },
        bg: { type: "text", label: "Background Color" },
        bgImage: { type: "text", label: "Background Image URL" },
        bgOpacity: { type: "text", label: "Background Opacity 0-100" },
        textColor: { type: "text" },
        layout: { type: "select", label: "Layout", options: [{ label: "Center", value: "center" }, { label: "Left", value: "left" }, { label: "Split", value: "split" }] },
        mask: { type: "select", label: "Mask Shape", options: [{ label: "None", value: "none" }, { label: "Rounded", value: "rounded" }, { label: "Arch", value: "arch" }, { label: "Circle", value: "circle" }, { label: "Blob", value: "blob" }] },
        borderWidth: { type: "select", label: "Border Width", options: [{ label: "None", value: "0" }, { label: "1px", value: "1" }, { label: "2px", value: "2" }, { label: "4px", value: "4" }] },
        borderColor: { type: "text", label: "Border Color" },
        borderStyle: { type: "select", label: "Border Style", options: [{ label: "Solid", value: "solid" }, { label: "Dashed", value: "dashed" }, { label: "Dotted", value: "dotted" }] },
      },
      defaultProps: { title: "Heading Title", subtitle: "Subheading detail.", ctaText: "Action Link", ctaLink: "#", bg: "#0F172A", bgImage: "", bgOpacity: "100", textColor: "#FFFFFF", layout: "center", mask: "none", borderWidth: "0", borderColor: "#FFFFFF", borderStyle: "solid" },
      render: ({ title, subtitle, ctaText, ctaLink, bg, bgImage, bgOpacity, textColor, layout, mask, borderWidth, borderColor, borderStyle }: any) => {
        const op = Math.min(100, Math.max(0, parseInt(bgOpacity) || 100)) / 100;
        const radius = mask === "arch" ? "999px 999px 24px 24px" : mask === "circle" ? "50%" : mask === "blob" ? "60% 40% 30% 70% / 60% 30% 70% 40%" : mask === "rounded" ? "24px" : "0px";
        const border = borderWidth !== "0" ? `${borderWidth}px ${borderStyle} ${borderColor}` : undefined;
        const bgLayer = bgImage ? `url(${bgImage})` : undefined;
        const content = (
          <>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">{title}</h1>
            <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">{subtitle}</p>
            <a href={safeHref(ctaLink)} className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 font-semibold rounded-lg text-sm text-white shadow-md">{ctaText}</a>
          </>
        );
        if (layout === "split") {
          return (
            <section className="py-20 px-8" style={{ color: textColor }}>
              <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
                <div className="text-left"><h1 className="text-4xl font-extrabold mb-4">{title}</h1><p className="text-lg opacity-90 mb-8">{subtitle}</p><a href={safeHref(ctaLink)} className="inline-block px-6 py-3 bg-blue-600 font-semibold rounded-lg text-sm text-white">{ctaText}</a></div>
                <div style={{ minHeight: 320, backgroundColor: hexToRgba(bg, op), backgroundImage: bgLayer, backgroundSize: "cover", backgroundPosition: "center", borderRadius: radius, border }} className="w-full flex items-center justify-center"><span className="opacity-60 text-sm">Hero Visual</span></div>
              </div>
            </section>
          );
        }
        return (
          <section className={`py-20 px-8 relative overflow-hidden ${layout === "left" ? "text-left" : "text-center"}`} style={{ backgroundColor: bg, color: textColor, borderRadius: radius, border }}>
            {bgImage && <div className="absolute inset-0" style={{ backgroundImage: bgLayer, backgroundSize: "cover", backgroundPosition: "center", opacity: op }} />}
            {bgImage && <div className="absolute inset-0" style={{ backgroundColor: hexToRgba(bg, 1 - op) }} />}
            <div className={`relative max-w-3xl ${layout === "left" ? "" : "mx-auto"}`}>{content}</div>
          </section>
        );
      },
    },
    Section: {
      fields: {
        bg: { type: "text", label: "Background" },
        padding: { type: "select", options: [{ label: "Compact", value: "py-8" }, { label: "Standard", value: "py-16" }, { label: "Impact", value: "py-28" }] },
        containWidth: { type: "radio", options: [{ label: "Boxed", value: "max-w-7xl mx-auto" }, { label: "Full Width", value: "w-full" }] },
      },
      defaultProps: { bg: "#ffffff", padding: "py-16", containWidth: "max-w-7xl mx-auto" },
      render: ({ bg, padding, containWidth, puck }: any) => <section style={{ background: bg }} className={`${padding} px-4 md:px-8 w-full`}><div className={containWidth}>{puck.renderDropZone({ zone: "content" })}</div></section>,
    },
    Columns: {
      fields: {
        distribution: { type: "select", options: [{ label: "1/2 + 1/2", value: "1-1" }, { label: "1/3 + 1/3 + 1/3", value: "1-1-1" }, { label: "2/3 + 1/3", value: "2-1" }] },
        gap: { type: "select", options: [{ label: "Tight", value: "gap-4" }, { label: "Comfortable", value: "gap-8" }, { label: "Wide", value: "gap-12" }] },
      },
      defaultProps: { distribution: "1-1", gap: "gap-8" },
      render: ({ distribution, gap, puck }: any) => {
        let grid = "grid grid-cols-1 md:grid-cols-2";
        if (distribution === "1-1-1") grid = "grid grid-cols-1 md:grid-cols-3";
        if (distribution === "2-1") grid = "grid grid-cols-1 md:grid-cols-3 [&>:nth-child(1)]:md:col-span-2";
        return <div className={`${grid} ${gap} w-full items-center my-6`}><div className="border border-dashed border-slate-200 rounded-xl p-4 min-h-[100px]">{puck.renderDropZone({ zone: "left-column" })}</div><div className="border border-dashed border-slate-200 rounded-xl p-4 min-h-[100px]">{puck.renderDropZone({ zone: "right-column" })}</div>{distribution === "1-1-1" && <div className="border border-dashed border-slate-200 rounded-xl p-4 min-h-[100px]">{puck.renderDropZone({ zone: "third-column" })}</div>}</div>;
      },
    },
    Spacer: {
      fields: { height: { type: "select", options: [{ label: "Small 24px", value: "h-6" }, { label: "Medium 48px", value: "h-12" }, { label: "Large 96px", value: "h-24" }] } },
      defaultProps: { height: "h-12" },
      render: ({ height }: any) => <div className={height} />,
    },
    DynamicCards: {
      fields: { sectionTitle: { type: "text" }, cardCount: { type: "select", options: [{ label: "2 Columns", value: "2" }, { label: "3 Columns", value: "3" }, { label: "4 Columns", value: "4" }] }, itemsJson: { type: "textarea" } },
      defaultProps: { sectionTitle: "Premium Business Offerings", cardCount: "3", itemsJson: JSON.stringify([{ title: "Corporate Registration", desc: "Complete end-to-end processing.", icon: "🏢" }, { title: "PRO Licensing", desc: "Clearance and visa automation.", icon: "📑" }, { title: "Market Entry", desc: "Feasibility for local success.", icon: "📈" }], null, 2) },
      render: ({ sectionTitle, cardCount, itemsJson }: any) => {
        const { items, error } = parseItems(itemsJson, isCard);
        const cols = cardCount === "4" ? "md:grid-cols-4" : cardCount === "2" ? "md:grid-cols-2" : "md:grid-cols-3";
        return <div className="py-12 w-full"><h2 className="text-3xl font-extrabold text-center mb-10 text-slate-900">{sectionTitle}</h2>{error && <p className="text-center text-red-700">{error}</p>}<div className={`grid grid-cols-1 ${cols} gap-6`}>{items.map((it: any, i: number) => <div key={i} className="border p-8 rounded-2xl bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition"><span className="text-4xl mb-4 block">{it.icon}</span><h3 className="font-bold text-xl mb-2">{it.title}</h3><p className="text-sm text-slate-500">{it.desc}</p></div>)}</div></div>;
      },
    },
    CardGrid: {
      fields: { title: { type: "text" }, itemsJson: { type: "textarea" } },
      defaultProps: { title: "Our Services", itemsJson: JSON.stringify([{ title: "Company Formation", desc: "Fast-track licensing in Qatar", icon: "🏢" }, { title: "PRO Services", desc: "Visas, documents", icon: "📄" }, { title: "Business Growth", desc: "Market entry", icon: "🚀" }], null, 2) },
      render: ({ title, itemsJson }: any) => {
        let cards: any[] = []; try { cards = JSON.parse(itemsJson); } catch { cards = []; }
        return <div className="py-12"><h2 className="text-3xl font-bold text-center mb-8">{title}</h2><div className="grid md:grid-cols-3 gap-6">{cards.map((c: any, i: number) => <div key={i} className="border p-6 rounded-2xl bg-white shadow-sm hover:shadow-lg transition"><div className="text-3xl mb-3">{c.icon}</div><h3 className="font-bold text-lg mb-2">{c.title}</h3><p className="text-sm text-gray-500">{c.desc}</p></div>)}</div></div>;
      },
    },
    StatsBar: {
      fields: { itemsJson: { type: "textarea" } },
      defaultProps: { itemsJson: `[{"label":"Metric Label","val":"100%"}]` },
      render: ({ itemsJson }: any) => {
        const { items, error } = parseItems(itemsJson, isStat);
        return <section className="bg-zinc-900 text-zinc-100 py-10 px-8"><div className="max-w-7xl mx-auto flex flex-wrap justify-around gap-6 text-center">{items.map((it: any) => <div key={it.label} className="min-w-[150px]"><div className="text-3xl font-black text-blue-500 mb-1">{it.val}</div><div className="text-xs text-zinc-400 uppercase tracking-wider">{it.label}</div></div>)}</div>{error && <p className="text-center text-red-300">{error}</p>}</section>;
      },
    },
    FeaturesMatrix: {
      fields: { sectionTitle: { type: "text" }, itemsJson: { type: "textarea" } },
      defaultProps: { sectionTitle: "Performance Framework", itemsJson: `[{"title":"Metric Node","desc":"System parameter logs.","icon":"🌐"}]` },
      render: ({ sectionTitle, itemsJson }: any) => {
        const { items, error } = parseItems(itemsJson, isCard);
        return <section className="py-16 px-8 max-w-7xl mx-auto"><h2 className="text-xl font-extrabold mb-8 border-l-4 border-blue-600 pl-3">{sectionTitle}</h2><div className="grid grid-cols-1 lg:grid-cols-2 gap-8">{items.map((it: any) => <div key={it.title} className="flex gap-4 p-4 hover:bg-zinc-50 rounded-xl"><div className="p-3 bg-blue-50 text-blue-600 rounded-xl text-xl shrink-0">{it.icon}</div><div><h3 className="font-bold text-sm mb-0.5">{it.title}</h3><p className="text-xs text-zinc-500 max-w-md">{it.desc}</p></div></div>)}</div></section>;
      },
    },
    WhatsApp: {
      fields: { phone: { type: "text", label: "WhatsApp Number (974...)" }, message: { type: "text", label: "Default Message" }, label: { type: "text", label: "Button Text" } },
      defaultProps: { phone: "97400000000", message: "Hi, I want to enquire", label: "Chat on WhatsApp" },
      render: ({ phone, message, label }: any) => <WhatsAppBlock phone={phone} message={message} label={label} />,
    },

    Form: {
      fields: { formId: { type: "text", label: "Form ID" }, title: { type: "text", label: "Override Title" }, bg: { type: "text", label: "Background" } },
      defaultProps: { formId: "", title: "", bg: "#f8fafc" },
      render: ({ formId, title, bg }: any) => <FormRenderer formId={formId} title={title} bg={bg} />,
    },
    Embed: {
      fields: { url: { type: "text", label: "Embed URL" }, height: { type: "text", label: "Height" } },
      defaultProps: { url: "", height: "600" },
      render: ({ url, height }: any) => <EmbedRenderer url={url} height={height} />,
    },
  },
};

