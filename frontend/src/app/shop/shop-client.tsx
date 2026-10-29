"use client";

import { useState } from "react";
import { whatsappNumber } from "@/lib/contact-details";

type Product = {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    category: string;
    features: string[];
    downloadUrl: string | null;
    bestseller?: boolean;
    active?: boolean;
};

export default function ShopClient({ products }: { products: Product[] }) {
    const [filter, setFilter] = useState("All");
    const categories = ["All", "Excel Template", "Power BI", "Bundle", "Service", "Consulting Kit"];
    const activeProducts = products.filter(p => p.active !== false);
    const filtered = filter === "All" ? activeProducts : activeProducts.filter(p => p.category === filter);

    const whatsappLink = (p: Product) =>
        `https://wa.me/${whatsappNumber}?text=Hi TMG, I want to buy: ${p.title} - $${p.price} USD`;

    const handlePayPal = (product: Product) => {
        if (!product.downloadUrl) {
            window.open(whatsappLink(product), "_blank");
            return;
        }
        const paypalMe = `https://www.paypal.com/paypalme/tmgbusiness/${product.price}`;
        window.open(paypalMe, "_blank");
        alert(`After PayPal payment of $${product.price} USD, send screenshot to WhatsApp and you get instant download link.`);
    };

    return (
        <div className="w-full" style={{ background: "var(--background)" }}>
            <section className="text-white py-16" style={{ background: "var(--header-bg)" }}>
                <div className="mx-auto px-6" style={{ maxWidth: "var(--container-max)" }}>
                    <p className="uppercase tracking-[0.2em] text-xs font-semibold" style={{ color: "var(--gold)" }}>TMG Shop</p>
                    <h1 className="font-black text-4xl mt-3" style={{ fontFamily: "var(--font-family)" }}>
                        Templates That <span style={{ color: "var(--gold)" }}>Make Money</span>
                    </h1>
                    <p className="mt-4 opacity-70 max-w-2xl">Buy once, use forever. Instant delivery via WhatsApp after payment. All prices in USD.</p>
                </div>
            </section>

            <div className="mx-auto px-6 py-8 flex flex-wrap gap-2" style={{ maxWidth: "var(--container-max)" }}>
                {categories.map(c => (
                    <button key={c} onClick={() => setFilter(c)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${filter === c ? 'text-black' : 'bg-white hover:bg-slate-50'}`}
                        style={{ background: filter === c ? "var(--gold)" : "var(--card-bg)", borderColor: "var(--border-color)", borderRadius: "var(--button-radius)" }}>
                        {c}
                    </button>
                ))}
            </div>

            <div className="mx-auto px-6 pb-20 grid md:grid-cols-2 xl:grid-cols-3 gap-6" style={{ maxWidth: "var(--container-max)" }}>
                {filtered.map(product => (
                    <div key={product.id} className="p-5 shadow-sm hover:shadow-lg transition hover:-translate-y-1 bg-white" style={{ borderRadius: "var(--radius)", borderWidth: "var(--border-width)", borderColor: "var(--border-color)" }}>
                        {product.bestseller && <div className="inline-block text-xs font-bold px-2 py-1 rounded mb-3 text-black" style={{ background: "var(--gold)" }}>BESTSELLER</div>}
                        <div className="h-44 bg-slate-100 rounded-lg mb-4 flex items-center justify-center font-bold opacity-50" style={{ borderRadius: "var(--radius)" }}>{product.category}</div>
                        <div className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--gold)" }}>{product.category}</div>
                        <h3 className="font-bold text-lg mt-2" style={{ fontSize: "var(--h3-size)" }}>{product.title}</h3>
                        <p className="text-sm mt-2 opacity-70">{product.description}</p>
                        <ul className="mt-4 space-y-1 text-xs">
                            {product.features.map(f => <li key={f} className="flex gap-2"><span style={{ color: "var(--gold)" }}>✓</span> {f}</li>)}
                        </ul>
                        <div className="mt-6 flex items-center justify-between">
                            <div><span className="font-black text-2xl">${product.price} {product.currency}</span></div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <button onClick={() => handlePayPal(product)} className="py-3 font-bold text-sm text-center hover:opacity-90 cursor-pointer" style={{ background: "#FFC439", color: "#003087", borderRadius: "var(--button-radius)" }}>
                                Pay with PayPal
                            </button>
                            <a href={whatsappLink(product)} target="_blank" className="py-3 font-bold text-sm text-center text-white" style={{ background: "#25D366", borderRadius: "var(--button-radius)" }}>
                                WhatsApp Order
                            </a>
                        </div>
                        <p className="text-[11px] mt-3 opacity-50 text-center">Instant delivery after payment screenshot</p>
                    </div>
                ))}
            </div>
        </div>
    );
}