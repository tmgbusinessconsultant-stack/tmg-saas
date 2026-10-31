'use client';
import { useEffect, useState, use } from 'react';
import { Render } from '@measured/puck';
import { config } from '@/app/builder/[siteId]/config';

export default function PublicSite({ params }: { params: Promise<{ subdomain: string, page?: string[] }> }) {
    const { subdomain, page } = use(params);
    const pageSlug = page?.[0] || "home";
    const [site, setSite] = useState<any>(null);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentPageMeta, setCurrentPageMeta] = useState<any>(null);

    useEffect(() => {
        fetch(`http://localhost:4000/api/sites/by-subdomain/${subdomain}`)
            .then(r => r.json())
            .then(siteData => {
                setSite(siteData);
                const p = siteData.pages?.find((p: any) => p.slug === pageSlug) ||
                    siteData.pages?.find((p: any) => p.slug === "home") ||
                    siteData.pages?.[0];
                if (p) {
                    setCurrentPageMeta(p);
                    let content = p.content;
                    if (typeof content === 'string') { try { content = JSON.parse(content); } catch { content = { content: [], root: { props: {} } }; } }
                    if (!content) content = { content: [], root: { props: {} } };
                    else if (Array.isArray(content)) content = { content, root: { props: { title: p.title } } };
                    else if (!content.content && !content.root) content = { content: [content], root: { props: {} } };
                    if ((content as any).blocks && !content.content) {
                        content = { content: (content as any).blocks.map((b: any, i: number) => ({ type: b.type === 'text' ? 'Text' : b.type, props: { id: `old_${i}`, ...b } })), root: { props: {} } };
                    }
                    setData(content);
                }
                setLoading(false);
            }).catch(() => setLoading(false));
    }, [subdomain, pageSlug]);

    if (loading) return <div className="p-20 text-center font-medium">Loading {subdomain} — TMG Engine v2...</div>;
    if (!site) return <div className="p-20 text-center"><h1 className="text-2xl font-bold">Site not found: {subdomain}</h1><p className="text-gray-500 mt-2">Check subdomain or publish status</p></div>;

    const rootProps = data?.root?.props || config.root.defaultProps || {};
    const headerBg = rootProps.headerBg || "#ffffff";
    const headerColor = rootProps.headerColor || "#0a2540";
    const footerBg = rootProps.footerBg || "#0a2540";
    const footerColor = rootProps.footerColor || "#ffffff";
    const bg = rootProps.bg || "#ffffff";

    // === FULL WEBSITE PACK: header/footer from DB ===
    const logoUrl = site.logoUrl || site.headerData?.logoUrl || null;
    const companyNameHeader = site.headerData?.companyName || rootProps.siteName || site.name;
    const customMenu = site.headerData?.menu && Array.isArray(site.headerData.menu) ? site.headerData.menu : null;
    const footerAbout = site.footerData?.aboutText || null;
    const footerPhone = site.footerData?.phone || null;
    const footerEmail = site.footerData?.email || null;
    const footerCopyright = site.footerData?.copyright || `© ${new Date().getFullYear()} ${companyNameHeader}. Built with TMG Builder Pro v2`;

    const seoTitle = currentPageMeta?.seoTitle || (currentPageMeta?.title || companyNameHeader) + " | Best Business in Qatar";
    const seoDesc = currentPageMeta?.seoDesc || currentPageMeta?.description || `Leading ${site.settings?.industry ||'Business'} solutions in Qatar — ${companyNameHeader}. Trusted by 500+ companies.`;
    const canonicalUrl = `https://${site.domain || subdomain + '.tmg.qa'}${pageSlug === 'home' ? '' : '/' + pageSlug}`;
    const ogImage = rootProps.ogImage || "https://images.unsplash.com/photo-1497366216548-37526070297c";

    return (
        <div style={{ background: bg }}>
            <title>{seoTitle}</title>
            <meta name="description" content={seoDesc} />
            <meta property="og:title" content={seoTitle} />
            <meta property="og:description" content={seoDesc} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:image" content={ogImage} />
            <link rel="canonical" href={canonicalUrl} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ProfessionalService",
                "name": companyNameHeader,
                "description": seoDesc,
                "url": canonicalUrl,
                "address": { "@type": "PostalAddress", "addressLocality": "Doha", "addressCountry": "QA" },
            }) }} />

            <nav style={{ background: headerBg, color: headerColor }} className="border-b sticky top-0 z-50 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm backdrop-blur bg-white/90">
                <div className="flex items-center gap-3">
                    {logoUrl && <img src={logoUrl} alt={companyNameHeader} className="h-8 w-auto object-contain" />}
                    <span className="font-black text-xl tracking-tight">{companyNameHeader} {site.settings?.aiGenerated && <span className="ml-2 text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">✨ AI</span>}</span>
                    {site.domain && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🌐 {site.domain}</span>}
                </div>
                <div className="hidden md:flex gap-6">
                    {(customMenu || site.pages?.sort((a: any, b: any) => a.order - b.order)).map((p: any) => {
                        const isCustom = !!customMenu;
                        const href = isCustom ? p.href : `/s/${subdomain}${p.slug === "home" ? "" : "/" + p.slug}`;
                        const label = isCustom ? p.label : (p.seoTitle || p.title || p.slug);
                        const active = !isCustom && pageSlug === p.slug;
                        return (
                            <a key={isCustom ? p.label : p.slug} href={href}
                                style={{ color: active ? "#2563eb" : headerColor }}
                                className={`text-sm font-medium hover:text-blue-600 ${active ? "border-b-2 border-blue-600 pb-1" : ""}`}>
                                {label}
                            </a>
                        );
                    })}
                </div>
                <a href={`/s/${subdomain}/contact`} className="bg-black text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition">Contact</a>
            </nav>

            <main className="min-h-screen">
                {data && data.content?.length > 0 ? (
                    <Render config={config as any} data={data} />
                ) : (
                    <div className="p-20 text-center max-w-2xl mx-auto">
                        <h2 className="text-3xl font-black">{currentPageMeta?.seoTitle || currentPageMeta?.title || 'Welcome'}</h2>
                        <p className="text-gray-600 mt-4 text-lg">{seoDesc}</p>
                    </div>
                )}
            </main>

            <footer style={{ background: footerBg, color: footerColor }} className="py-16 px-8 mt-20">
                <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            {logoUrl && <img src={logoUrl} alt={companyNameHeader} className="h-8 w-auto object-contain brightness-0 invert" />}
                            <h3 className="font-black text-xl">{companyNameHeader}</h3>
                        </div>
                        <p className="text-sm opacity-80 leading-relaxed max-w-md">{footerAbout || seoDesc}</p>
                        <div className="mt-4 flex gap-2 text-[11px] opacity-60"><span>⚡ by TMGSaaS</span><span>•</span><span>{site.status}</span>{site.domain && <><span>•</span><span>{site.domain}</span></>}</div>
                    </div>
                    <div><h4 className="font-bold mb-3 text-sm uppercase tracking-wider opacity-90">Pages</h4>{site.pages?.sort((a: any, b: any) => a.order - b.order).map((p: any) => (<a key={p.slug} href={`/s/${subdomain}${p.slug === "home" ? "" : "/" + p.slug}`} className="block text-sm opacity-70 hover:opacity-100 mb-2 transition">{p.seoTitle || p.title || p.slug}</a>))}</div>
                    <div><h4 className="font-bold mb-3 text-sm uppercase tracking-wider opacity-90">Qatar Office</h4>
                        <p className="text-sm opacity-70">
                            Doha, Qatar<br />
                            {footerPhone || '+974 1234 5678'}<br />
                            {footerEmail || `hello@${subdomain}.qa`}
                        </p>
                    </div>
                </div>
                <div className="text-center text-xs opacity-40 mt-12 border-t border-white/10 pt-8">{footerCopyright}</div>
            </footer>
        </div>
    );
}
