import React from 'react';
import { Config } from '@measured/puck';

export const config: Config = {
    components: {
        Heading: {
            fields: {
                text: { type: "text", label: "Text Content" },
                level: {
                    type: "select",
                    options: [
                        { label: "Display Hero (H1)", value: "h1" },
                        { label: "Section Header (H2)", value: "h2" },
                        { label: "Sub-Header (H3)", value: "h3" }
                    ]
                },
                color: { type: "text", label: "Hex Text Color" },
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
                color: { type: "text", label: "Hex Color" },
                align: { type: "radio", options: [{ label: "Left", value: "left" }, { label: "Center", value: "center" }, { label: "Right", value: "right" }] }
            },
            defaultProps: { text: "TMG helps entrepreneurs start and grow in Qatar.", color: "#4a5568", align: "left" },
            render: ({ text, color, align }: any) => (
                <p style={{ color, textAlign: align }} className="text-base md:text-lg max-w-3xl leading-relaxed mb-4 whitespace-pre-wrap">{text}</p>
            ),
        },
        Button: {
            fields: {
                text: { type: "text", label: "Button Label" },
                link: { type: "text", label: "Redirect Target URL" },
                bg: { type: "text", label: "Button Background Color" },
                variant: { type: "select", options: [{ label: "Solid Filled", value: "solid" }, { label: "Outline Minimal", value: "outline" }] },
                align: { type: "radio", options: [{ label: "Left", value: "left" }, { label: "Center", value: "center" }, { label: "Right", value: "right" }] }
            },
            defaultProps: { text: "Get Free Consultation", link: "/contact", bg: "#0a2540", variant: "solid", align: "left" },
            render: ({ text, link, bg, variant, align }: any) => (
                <div style={{ textAlign: align }} className="my-2">
                    <a href={link} style={variant === 'solid' ? { background: bg } : { borderColor: bg, color: bg }} className={`px-8 py-3.5 rounded-xl inline-block font-semibold shadow-sm transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] text-sm md:text-base ${variant === 'solid' ? 'text-white' : 'border-2 bg-transparent'}`}>{text}</a>
                </div>
            ),
        },
        Image: {
            fields: {
                url: { type: "text", label: "Asset Source URL" },
                alt: { type: "text", label: "SEO Alternative Alt Text" },
                aspectRatio: { type: "select", options: [{ label: "Auto Landscape", value: "auto" }, { label: "Square (1:1)", value: "square" }, { label: "Video (16:9)", value: "video" }] }
            },
            defaultProps: { url: "https://images.unsplash.com/photo-1497366216548-37526070297c", alt: "Modern Office Workspace", aspectRatio: "auto" },
            render: ({ url, alt, aspectRatio }: any) => {
                const aspectClass = aspectRatio === 'square' ? 'aspect-square object-cover' : aspectRatio === 'video' ? 'aspect-video object-cover' : 'w-full h-auto';
                return (<div className="w-full my-4 overflow-hidden rounded-2xl shadow-md border border-slate-100"><img src={url} alt={alt} className={`${aspectClass} transition-transform duration-500 hover:scale-105`} /></div>);
            },
        },

        /* === UPGRADE: AI REQUIRED BLOCKS === */
        Hero: {
            fields: {
                title: { type: "text", label: "Hero Title" },
                subtitle: { type: "textarea", label: "Hero Subtitle" },
                ctaText: { type: "text", label: "CTA Button Text" },
                ctaLink: { type: "text", label: "CTA Link" },
                bg: { type: "text", label: "Background Color" },
            },
            defaultProps: { title: "Grow Your Business in Qatar", subtitle: "We help international companies establish and thrive with our proven PRO and corporate services.", ctaText: "Start Now", ctaLink: "/contact", bg: "#0a2540" },
            render: ({ title, subtitle, ctaText, ctaLink, bg }: any) => (
                <div style={{ background: bg }} className="py-24 px-8 text-center text-white rounded-2xl">
                    <h1 className="text-5xl font-black mb-4">{title}</h1>
                    <p className="text-xl opacity-80 max-w-2xl mx-auto mb-8">{subtitle}</p>
                    <a href={ctaLink} className="bg-white text-black px-8 py-3 rounded-xl font-bold inline-block">{ctaText}</a>
                </div>
            ),
        },
        CardGrid: {
            label: "Card Grid (AI)",
            fields: {
                title: { type: "text", label: "Section Title" },
                itemsJson: { type: "textarea", label: "Cards JSON (AI generates this)" }
            },
            defaultProps: {
                title: "Our Services",
                itemsJson: JSON.stringify([
                    { title: "Company Formation", desc: "Fast-track licensing in Qatar", icon: "🏢" },
                    { title: "PRO Services", desc: "Visas, documents, ministries", icon: "📄" },
                    { title: "Business Growth", desc: "Market entry strategy", icon: "🚀" }
                ], null, 2)
            },
            render: ({ title, itemsJson }: any) => {
                let cards: any[] = [];
                try { cards = JSON.parse(itemsJson); } catch { cards = []; }
                return (
                    <div className="py-12">
                        <h2 className="text-3xl font-bold text-center mb-8">{title}</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            {cards.map((c: any, i: number) => (
                                <div key={i} className="border p-6 rounded-2xl bg-white shadow-sm hover:shadow-lg transition">
                                    <div className="text-3xl mb-3">{c.icon}</div>
                                    <h3 className="font-bold text-lg mb-2">{c.title}</h3>
                                    <p className="text-sm text-gray-500">{c.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }
        },
        Spacer: {
            fields: {
                height: { type: "select", label: "Height", options: [{ label: "Small 24px", value: "h-6" }, { label: "Medium 48px", value: "h-12" }, { label: "Large 96px", value: "h-24" }] }
            },
            defaultProps: { height: "h-12" },
            render: ({ height }: any) => <div className={height} />,
        },

        /* Enterprise Grid Engine */
        Columns: {
            fields: {
                distribution: { type: "select", label: "Column Layout Distribution", options: [{ label: "1/2 + 1/2 Split", value: "1-1" }, { label: "1/3 + 1/3 + 1/3 Trio", value: "1-1-1" }, { label: "2/3 + 1/3 Main Sidebar", value: "2-1" }] },
                gap: { type: "select", label: "Internal Grid Spacing", options: [{ label: "Tight", value: "gap-4" }, { label: "Comfortable", value: "gap-8" }, { label: "Wide", value: "gap-12" }] }
            },
            defaultProps: { distribution: "1-1", gap: "gap-8" },
            render: ({ distribution, gap, puck }: any) => {
                let gridClasses = "grid grid-cols-1 md:grid-cols-2";
                if (distribution === "1-1-1") gridClasses = "grid grid-cols-1 md:grid-cols-3";
                if (distribution === "2-1") gridClasses = "grid grid-cols-1 md:grid-cols-3 [&>:nth-child(1)]:md:col-span-2";
                return (<div className={`grid ${gridClasses} ${gap} w-full items-center my-6`}><div className="border border-dashed border-slate-200 rounded-xl p-4 min-h-[100px]">{puck.renderDropZone({ zone: "left-column" })}</div><div className="border border-dashed border-slate-200 rounded-xl p-4 min-h-[100px]">{puck.renderDropZone({ zone: "right-column" })}</div>{distribution === "1-1-1" && <div className="border border-dashed border-slate-200 rounded-xl p-4 min-h-[100px]">{puck.renderDropZone({ zone: "third-column" })}</div>}</div>);
            }
        },
        Section: {
            fields: {
                bg: { type: "text", label: "Hex Background or Variable Color" },
                padding: { type: "select", options: [{ label: "Compact", value: "py-8" }, { label: "Standard", value: "py-16" }, { label: "Impact Hero", value: "py-28" }] },
                containWidth: { type: "radio", label: "Layout Containment", options: [{ label: "Boxed Frame Container", value: "max-w-7xl mx-auto" }, { label: "Full Fluid Width", value: "w-full" }] }
            },
            defaultProps: { bg: "#ffffff", padding: "py-16", containWidth: "max-w-7xl mx-auto" },
            render: ({ bg, padding, containWidth, puck }: any) => (<section style={{ background: bg }} className={`${padding} px-4 md:px-8 w-full transition-all duration-300`}><div className={containWidth}>{puck.renderDropZone({ zone: "content" })}</div></section>),
        },
        DynamicCards: {
            fields: {
                sectionTitle: { type: "text", label: "Main Header Section Title" },
                cardCount: { type: "radio", label: "Visible Grid Columns", options: [{ label: "2 Columns", value: "2" }, { label: "3 Columns", value: "3" }, { label: "4 Columns", value: "4" }] },
                itemsJson: { type: "textarea", label: "Cards Array JSON Schema Structure" }
            },
            defaultProps: { sectionTitle: "Premium Business Offerings", cardCount: "3", itemsJson: JSON.stringify([{ title: "Corporate Registration", desc: "Complete end-to-end processing for international entities.", icon: "🏢" }, { title: "PRO Licensing Framework", desc: "Clearance, ministries integration, and visa automation pipeline.", icon: "📑" }, { title: "Strategic Market Entry", desc: "Feasibility modeling built exclusively for local market success.", icon: "📈" }], null, 2) },
            render: ({ sectionTitle, cardCount, itemsJson }: any) => {
                let cards = []; try { cards = JSON.parse(itemsJson); } catch (e) { cards = []; }
                const gridCols = cardCount === "4" ? "md:grid-cols-4" : cardCount === "2" ? "md:grid-cols-2" : "md:grid-cols-3";
                return (<div className="py-12 w-full"><h2 className="text-3xl font-extrabold tracking-tight text-center mb-10 text-slate-900">{sectionTitle}</h2><div className={`grid grid-cols-1 ${gridCols} gap-6`}>{cards.map((item: any, idx: number) => (<div key={idx} className="border border-slate-100 p-8 rounded-2xl bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"><div><span className="text-4xl mb-4 block filter drop-shadow-sm group-hover:scale-110 transition-transform duration-200">{item.icon || '💼'}</span><h3 className="font-bold text-xl text-slate-800 mb-2">{item.title}</h3><p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p></div><span className="text-xs font-bold text-indigo-600 mt-6 block uppercase tracking-wider cursor-pointer hover:underline">Learn More &rarr;</span></div>))}</div></div>);
            },
        },
    },
    root: {
        fields: {
            bg: { type: "text", label: "Global App Body Background" },
            headerBg: { type: "text", label: "Navigation Header Color" },
            headerColor: { type: "text", label: "Navigation Typography Text Color" },
            footerBg: { type: "text", label: "Footer Layout Accent Color" },
            footerColor: { type: "text", label: "Footer Typography Text Color" },
            siteName: { type: "text", label: "Master Brand Identity Name" },
        },
        defaultProps: { bg: "#ffffff", headerBg: "#ffffff", headerColor: "#0a2540", footerBg: "#0a2540", footerColor: "#ffffff", siteName: "TMG Business Consulting" },
    },
};