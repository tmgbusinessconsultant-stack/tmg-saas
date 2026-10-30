"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { whatsappNumber } from "@/lib/contact-details";

type Product = { id: string; title: string; description: string; price: number; currency: string; category: string; features: string[]; downloadUrl: string | null; imageUrl?: string | null; mediaId?: string | null; type?: "PRODUCT" | "SERVICE"; bestseller?: boolean; active?: boolean; };

export default function ShopClient({ products, title, subtitle }: { products: Product[], title: string, subtitle: string }) {
    const [filter, setFilter] = useState("All");
    const [buying, setBuying] = useState<string | null>(null);
    const router = useRouter();
    const categories = ["All", ...Array.from(new Set(products.map(p=>p.category).filter(Boolean)))];
    const filtered = filter==="All" ? products : products.filter(p=>p.category===filter);
    const whatsappLink = (p: Product) => `https://wa.me/${whatsappNumber}?text=Hi TMG, I want to buy: ${p.title} - $${p.price} ${p.currency || 'USD'}`;
    const handleBuyProduct = async (product: Product) => {
      try {
        setBuying(product.id);
        const apiBase = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || "http://localhost:3001";
        const base = apiBase.endsWith("/api") ? apiBase : `${apiBase}/api`;
        const orderRes = await fetch(`${base}/payments/shop/orders`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product }) });
        const order = await orderRes.json();
        const captureRes = await fetch(`${base}/payments/shop/capture`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderID: order.id, product }) });
        const capture = await captureRes.json();
        if (capture.success) {
          if (product.downloadUrl) window.open(product.downloadUrl, "_blank");
          else if (product.mediaId) window.open(`${base}/content/media/${product.mediaId}/download?token=${capture.downloadToken}`, "_blank");
          router.push(`/shop/success?productId=${product.id}&token=${capture.downloadToken}`);
        } else throw new Error("Capture failed");
      } catch (e) {
        window.open(whatsappLink(product), "_blank");
      } finally { setBuying(null); }
    };
    return (
        <div className="w-full">
            <section className="text-white py-16" style={{ background: "var(--header-bg)" }}>
                <div className="mx-auto px-6" style={{ maxWidth: "var(--container-max)" }}>
                    <p className="uppercase tracking-[0.2em] text-xs font-semibold" style={{ color: "var(--gold)" }}>TMG SHOP</p>
                    <h1 className="font-black text-4xl mt-3">{title}</h1>
                    <p className="mt-4 opacity-70 max-w-2xl">{subtitle}</p>
                </div>
            </section>
            <div className="mx-auto px-6 py-8 flex flex-wrap gap-2" style={{ maxWidth: "var(--container-max)" }}>
                {categories.map(c => (<button key={c} onClick={() => setFilter(c)} className={`px-4 py-2 rounded-full text-sm font-semibold border ${filter===c?'text-black':'bg-white'}`} style={{ background: filter===c?"var(--gold)":"var(--card-bg)" }}>{c}</button>))}
            </div>
            {filtered.length===0 ? (<div className="mx-auto px-6 pb-20 text-center">No products in this category</div>) : (
              <div className="mx-auto px-6 pb-20 grid md:grid-cols-2 xl:grid-cols-3 gap-6" style={{ maxWidth: "var(--container-max)" }}>
                  {filtered.map(product => (
                      <div key={product.id} className="p-5 bg-white shadow-sm" style={{ borderRadius: "var(--radius)", border: "1px solid var(--border-color)" }}>
                          {product.bestseller && <div className="inline-block text-xs font-bold px-2 py-1 rounded mb-3 text-black" style={{ background: "var(--gold)" }}>BESTSELLER</div>}
                          {product.imageUrl ? (<img src={product.imageUrl} alt={product.title} className="h-44 w-full object-cover rounded-lg mb-4" />) : (<div className="h-44 bg-slate-100 rounded-lg mb-4 flex items-center justify-center font-bold opacity-50">{product.category}</div>)}
                          <div className="text-xs font-bold uppercase" style={{ color: "var(--gold)"}}>{product.category} • Instant Download</div>
                          <h3 className="font-bold text-lg mt-2">{product.title}</h3>
                          <p className="text-sm mt-2 opacity-70">{product.description}</p>
                          <div className="mt-6 flex items-center justify-between"><span className="font-black text-2xl">${product.price} {product.currency}</span></div>
                          <div className="mt-4 grid grid-cols-2 gap-2">
                              <button disabled={buying===product.id} onClick={() => handleBuyProduct(product)} className="py-3 font-bold text-sm" style={{ background: "#FFC439", color: "#003087", borderRadius: "var(--button-radius)" }}>{buying===product.id ? "..." : "Buy Now"}</button>
                              <a href={whatsappLink(product)} target="_blank" className="py-3 font-bold text-sm text-center text-white" style={{ background: "#25D366", borderRadius: "var(--button-radius)" }}>WhatsApp</a>
                          </div>
                      </div>
                  ))}
              </div>
            )}
        </div>
    );
}
