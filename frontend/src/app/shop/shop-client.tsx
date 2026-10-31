"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { whatsappNumber } from "@/lib/contact-details";

type Product = {
    id: string; title: string; description: string; price: number; currency: string;
    category: string; features: string[]; downloadUrl: string | null; imageUrl?: string | null;
    mediaId?: string | null; type?: "PRODUCT" | "SERVICE"; bestseller?: boolean; active?: boolean;
};

export default function ShopClient({ products, title, subtitle }: { products: Product[], title: string, subtitle: string }) {
    const [filter, setFilter] = useState("All");
    const [buying, setBuying] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const router = useRouter();

    const categories = useMemo(() => ["All", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))], [products]);

    const filtered = useMemo(() => {
        let list = filter === "All" ? products : products.filter(p => p.category === filter);
        if (search) list = list.filter(p => (p.title + p.description).toLowerCase().includes(search.toLowerCase()));
        // BEST: Bestseller first, then cheapest
        return [...list].sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0) || a.price - b.price);
    }, [products, filter, search]);

    const whatsappLink = (p: Product) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi TMG, I want to buy: ${p.title} - $${p.price} ${p.currency || 'USD'}`)}`;

    const handleBuyProduct = async (product: Product) => {
        try {
            setBuying(product.id);
            const apiBase = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || "http://localhost:4000";
            const base = apiBase.endsWith("/api") ? apiBase : `${apiBase}/api`;

            // UPGRADE: Track analytics
            fetch(`${base}/ai/search-analytics`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: `shop_buy_${product.id}`, resultCount: 1 }) }).catch(() => { });

            const orderRes = await fetch(`${base}/payments/shop/orders`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product }) });
            if (!orderRes.ok) throw new Error("Order failed");
            const order = await orderRes.json();

            const captureRes = await fetch(`${base}/payments/shop/capture`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderID: order.id, product }) });
            const capture = await captureRes.json();

            if (capture.success) {
                if (product.downloadUrl) window.open(product.downloadUrl, "_blank");
                else if (product.mediaId) window.open(`${base}/content/media/${product.mediaId}/download?token=${capture.downloadToken}`, "_blank");
                router.push(`/shop/success?productId=${product.id}&token=${capture.downloadToken}`);
            } else throw new Error("Capture unverified");
        } catch (e) {
            console.warn("Direct checkout failed, WhatsApp fallback", e);
            window.open(whatsappLink(product), "_blank");
        } finally { setBuying(null); }
    };

    return (
        <div className="w-full bg-slate-50/40 min-h-screen">
            <section className="text-white py-20 bg-slate-900 border-b relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.15),transparent_50%)]" />
                <div className="mx-auto px-6 max-w-7xl relative z-10">
                    <p className="uppercase tracking-[0.25em] text-xs font-bold text-blue-500">TMG Premium Resources — Instant Access</p>
                    <h1 className="font-black text-4xl md:text-5xl tracking-tight mt-3">{title}</h1>
                    <p className="mt-4 text-slate-400 max-w-2xl">{subtitle} — {products.length} products, instant download, Qatar & GCC compliant templates.</p>
                    <div className="mt-6 flex gap-3">
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates, business plans..." className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm w-full max-w-md placeholder:text-slate-400 focus:outline-none focus:border-blue-500" />
                        <div className="text-xs bg-white/10 px-3 py-2 rounded-full">{filtered.length} items</div>
                    </div>
                </div>
            </section>

            <div className="mx-auto px-6 py-8 max-w-7xl flex flex-wrap gap-2.5 items-center border-b border-slate-200/60">
                {categories.map(c => (
                    <button key={c} onClick={() => setFilter(c)} className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${filter === c ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-white text-slate-600 border hover:border-slate-400'}`}>{c} {filter === c && `(${filtered.length})`}</button>
                ))}
            </div>

            <div className="mx-auto px-6 pb-24 max-w-7xl mt-8">
                {filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed max-w-md mx-auto"><span className="text-3xl">📦</span><p className="text-slate-500 mt-2">No products for "{search || filter}"</p></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filtered.map(product => (
                            <div key={product.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col overflow-hidden group">
                                <div className="p-6">
                                    <div className="relative overflow-hidden rounded-xl mb-5 bg-slate-50 aspect-[16/10]">
                                        {product.bestseller && <div className="absolute top-3 left-3 z-10 text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-md bg-amber-400 text-slate-900 shadow">🔥 Bestseller</div>}
                                        {product.type && <div className="absolute top-3 right-3 z-10 text-[10px] uppercase font-bold px-2 py-1 rounded bg-slate-900 text-white">{product.type}</div>}
                                        {product.imageUrl ? <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover group-hover:scale-105 transition duration-500" /> : <div className="h-full flex flex-col items-center justify-center opacity-30 text-sm gap-1">📂 {product.category}</div>}
                                    </div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">{product.category} • Instant Access</div>
                                    <h3 className="font-extrabold text-xl tracking-tight group-hover:text-blue-600 transition">{product.title}</h3>
                                    <p className="text-sm text-slate-500 mt-2 line-clamp-3 leading-relaxed">{product.description}</p>
                                    {product.features?.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-1.5">
                                            {product.features.slice(0, 3).map((f, i) => <div key={i} className="flex gap-2 text-xs font-medium text-slate-600"><span className="text-emerald-500">✓</span><span className="truncate">{f}</span></div>)}
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 pt-0 mt-auto bg-slate-50/50 border-t border-slate-50">
                                    <div className="my-4 flex items-baseline justify-between">
                                        <div className="flex items-baseline gap-1"><span className="font-black text-2xl">${product.price}</span><span className="text-xs font-bold text-slate-400 uppercase">{product.currency || 'USD'}</span></div>
                                        <div className="text-[11px] text-slate-400">Instant download</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button disabled={buying === product.id} onClick={() => handleBuyProduct(product)} className="py-3 px-4 font-bold text-sm text-slate-900 rounded-xl bg-[#FFC439] hover:bg-[#f2b62c] disabled:opacity-50 shadow-sm flex items-center justify-center gap-2">
                                            {buying === product.id ? <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> : null}
                                            {buying === product.id ? "Processing..." : "Buy Now"}
                                        </button>
                                        <a href={whatsappLink(product)} target="_blank" className="py-3 px-4 font-bold text-sm rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-center flex items-center justify-center gap-1.5">
                                            <span>💬</span> WhatsApp
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SEO JSON-LD — BEST */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "ItemList", "name": title, "itemListElement": filtered.map((p, i) => ({ "@type": "ListItem", "position": i + 1, "item": { "@type": "Product", "name": p.title, "description": p.description, "offers": { "@type": "Offer", "price": p.price, "priceCurrency": p.currency || "USD" } } })) }) }} />
        </div>
    );
}