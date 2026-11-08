'use client';
import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import { Render, type Data } from '@measured/puck';
import {
  config,
  type RootProps,
} from '@/app/builder/[siteId]/config';

type PublicSiteData = Data;

interface PublicSitePage {
  slug: string;
  title?: string;
  seoTitle?: string;
  seoDesc?: string;
  description?: string;
  order: number;
  content?: unknown;
}

interface PublicSiteRecord {
  id: string;
  name: string;
  subdomain: string;
  logoUrl?: string;
  content?: unknown;
  pages?: PublicSitePage[];
  headerData?: { logoUrl?: string; companyName?: string; menu?: Array<{ label: string; href: string }> };
  footerData?: { aboutText?: string; phone?: string; email?: string; copyright?: string };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPublicSitePage(value: unknown): value is PublicSitePage {
  return isRecord(value)
    && typeof value.slug === 'string'
    && typeof value.order === 'number'
    && (value.title === undefined || typeof value.title === 'string')
    && (value.seoTitle === undefined || typeof value.seoTitle === 'string');
}

function isPublicSite(value: unknown): value is PublicSiteRecord {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.subdomain === 'string'
    && (value.pages === undefined || (Array.isArray(value.pages) && value.pages.every(isPublicSitePage)));
}

function isPublicSiteData(value: unknown): value is PublicSiteData {
  return isRecord(value) && isRecord(value.root) && Array.isArray(value.content);
}

function siteDataFromContent(value: unknown, title: string): PublicSiteData {
  let content = value;
  if (typeof content === 'string') {
    try {
      content = JSON.parse(content) as unknown;
    } catch {
      throw new Error('This page contains invalid saved content.');
    }
  }
  if (!content) return { root: { props: { title } }, content: [] };
  if (Array.isArray(content)) content = { root: { props: { title } }, content };
  else if (isRecord(content) && !('content' in content) && !('root' in content)) {
    content = { root: { props: { title } }, content: [content] };
  }
  if (!isPublicSiteData(content)) throw new Error('This page has an invalid saved content structure.');
  return content;
}

function safeMenuHref(value: string): string {
  if (value.startsWith('/') || /^(https?:|mailto:|tel:)/i.test(value)) return value;
  return '#';
}

export default function PublicSite({ params }: { params: Promise<{ subdomain: string, page?: string[] }> }) {
    const { subdomain, page } = use(params);
    const pageSlug = page?.[0] || "home";
    const [site, setSite] = useState<PublicSiteRecord | null>(null);
    const [data, setData] = useState<PublicSiteData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPageMeta, setCurrentPageMeta] = useState<PublicSitePage | null>(null);

    // STEP 7 - SEO: push seoTitle/seoDesc into browser tab + Google meta
    useEffect(() => {
        if (!currentPageMeta) return;
        const title = currentPageMeta.seoTitle || currentPageMeta.title || site?.name || subdomain;
        document.title = title;
        const desc = currentPageMeta.seoDesc || currentPageMeta.description || "";
        let meta = document.querySelector('meta[name="description"]');
        if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", "description"); document.head.appendChild(meta); }
        meta.setAttribute("content", desc);
    }, [currentPageMeta, site?.name, subdomain]);
    useEffect(() => {
        const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/+$/, "");
        let active = true;
        const loadSite = async () => {
            try {
                const response = await fetch(`${apiBase}/sites/by-subdomain/${encodeURIComponent(subdomain)}`);
                if (!response.ok) throw new Error(response.status === 404 ? "This site could not be found." : `Site request failed (${response.status}).`);
                const siteData: unknown = await response.json();
                if (!isPublicSite(siteData)) throw new Error("The site response has an invalid shape.");
                if (!active) return;
                setSite(siteData);
                void fetch(`${apiBase}/public/track/view/${encodeURIComponent(siteData.id)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ referrer: document.referrer }),
                }).then((trackingResponse) => {
                    if (!trackingResponse.ok) console.error(`Site view tracking failed (${trackingResponse.status}).`);
                }).catch((trackingError: unknown) => console.error("Site view tracking failed.", trackingError));

                const selectedPage = siteData.pages?.find((candidate) => candidate.slug === pageSlug)
                    || siteData.pages?.find((candidate) => candidate.slug === "home")
                    || siteData.pages?.[0];
                if (selectedPage) {
                    setCurrentPageMeta(selectedPage);
                    setData(siteDataFromContent(selectedPage.content, selectedPage.title || siteData.name));
                } else if (siteData.content) {
                    setCurrentPageMeta({ slug: "home", title: siteData.name, order: 0 });
                    setData(siteDataFromContent(siteData.content, siteData.name));
                } else {
                    setCurrentPageMeta(null);
                    setData(null);
                }
            } catch (loadError: unknown) {
                if (active) setError(loadError instanceof Error ? loadError.message : "The site could not be loaded.");
            } finally {
                if (active) setLoading(false);
            }
        };
        void loadSite();
        return () => { active = false; };
    }, [subdomain, pageSlug]);

    if (loading) return <div className="p-20 text-center font-medium">Loading {subdomain}...</div>;
    if (error || !site) return <div className="p-20 text-center"><h1 className="text-2xl font-bold">{error || `Site not found: ${subdomain}`}</h1></div>;

    const rootProps = (data?.root?.props || config.root?.defaultProps || {}) as Partial<RootProps>;
    const headerBg = rootProps.headerBg || "#ffffff";
    const headerColor = rootProps.headerColor || "#0a2540";
    const footerBg = rootProps.footerBg || "#0a2540";
    const footerColor = rootProps.footerColor || "#ffffff";
    const bg = rootProps.bg || "#ffffff";

    // LOGO FIX - handle /uploads + http
    const rawLogo = site.logoUrl || site.headerData?.logoUrl || null;
    let logoUrl = null;
    if (rawLogo) {
      if (rawLogo.startsWith("http")) logoUrl = rawLogo;
      else if (rawLogo.startsWith("/uploads")) logoUrl = `http://localhost:4000${rawLogo}`;
      else if (rawLogo.startsWith("uploads")) logoUrl = `http://localhost:4000/${rawLogo}`;
      else logoUrl = rawLogo;
    }
    const companyNameHeader = site.headerData?.companyName || rootProps.siteName || site.name;
    const customMenu = site.headerData?.menu ?? null;
    const orderedPages = [...(site.pages ?? [])].sort((a, b) => a.order - b.order);
    const footerAbout = site.footerData?.aboutText || null;
    const footerPhone = site.footerData?.phone || null;
    const footerEmail = site.footerData?.email || null;
    const footerCopyright = site.footerData?.copyright || `© ${new Date().getFullYear()} ${companyNameHeader}. Built with TMG Builder`;
    const navigationItems = customMenu
      ? customMenu.map((item, index) => ({
          key: `custom-${index}`,
          href: safeMenuHref(item.href),
          label: item.label,
          active: false,
        }))
      : orderedPages.map((sitePage) => ({
          key: sitePage.slug,
          href: `/s/${subdomain}${sitePage.slug === "home" ? "" : `/${sitePage.slug}`}`,
          label: sitePage.seoTitle || sitePage.title || sitePage.slug,
          active: pageSlug === sitePage.slug,
        }));

    return (
        <div style={{ background: bg }}>
            <nav style={{ background: headerBg, color: headerColor }} className="border-b sticky top-0 z-50 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    {logoUrl && <Image src={logoUrl} alt={companyNameHeader} width={160} height={48} unoptimized className="h-10 w-auto object-contain" />}
                    <span className="font-black text-xl tracking-tight">{companyNameHeader}</span>
                </div>
                <div className="hidden md:flex gap-6">
                    {navigationItems.map((item) => (
                      <a key={item.key} href={item.href}
                        style={{ color: item.active ? "#2563eb" : headerColor }}
                        className={`text-sm font-medium hover:text-blue-600 ${item.active ? "border-b-2 border-blue-600 pb-1" : ""}`}>
                        {item.label}
                      </a>
                    ))}
                </div>
                <a href={`/s/${subdomain}/contact`} className="bg-black text-white px-5 py-2 rounded-xl text-sm font-bold">Contact</a>
            </nav>

            <main className="min-h-screen">
                {data && data.content?.length > 0 ? (
                    <Render config={config} data={data} />
                ) : (
                    <div className="p-20 text-center max-w-2xl mx-auto">
                        <h2 className="text-3xl font-black">{currentPageMeta?.seoTitle || currentPageMeta?.title || 'Welcome'}</h2>
                        <p className="text-gray-600 mt-4">This site is being built. Edit in builder to add Hero, Services, Forms.</p>
                    </div>
                )}
            </main>

            <footer style={{ background: footerBg, color: footerColor }} className="py-16 px-8 mt-20">
                <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            {logoUrl && <Image src={logoUrl} alt={companyNameHeader} width={128} height={32} unoptimized className="h-8 w-auto object-contain brightness-0 invert" />}
                            <h3 className="font-black text-xl">{companyNameHeader}</h3>
                        </div>
                        <p className="text-sm opacity-80 leading-relaxed max-w-md">{footerAbout || 'Leading business in Qatar'}</p>
                    </div>
                    <div><h4 className="font-bold mb-3 text-sm uppercase">Pages</h4>{orderedPages.map((sitePage) => (<a key={sitePage.slug} href={`/s/${subdomain}${sitePage.slug === "home" ? "" : "/" + sitePage.slug}`} className="block text-sm opacity-70 hover:opacity-100 mb-2">{sitePage.seoTitle || sitePage.title || sitePage.slug}</a>))}</div>
                    <div><h4 className="font-bold mb-3 text-sm uppercase">Qatar Office</h4><p className="text-sm opacity-70">Doha, Qatar<br />{footerPhone || '+974 1234 5678'}<br />{footerEmail || `hello@${subdomain}.qa`}</p></div>
                </div>
                <div className="text-center text-xs opacity-40 mt-12 border-t border-white/10 pt-8">{footerCopyright}</div>
            </footer>
        </div>
    );
}

