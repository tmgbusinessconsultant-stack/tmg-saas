"use client";
import { useState, useEffect } from "react";

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

const DEFAULTS: Product[] = [
  { id: "excel-inventory-pro", title: "Inventory Tracker Pro - Excel", description: "Track stock, sales, low stock alerts.", price: 14, currency: "USD", category: "Excel Template", features: ["Auto stock alerts", "Sales report"], downloadUrl: "/products/inventory.xlsx", bestseller: true, active: true },
  { id: "sales-dashboard-pbi", title: "Sales Dashboard - Power BI", description: "CEO dashboard", price: 40, currency: "USD", category: "Power BI", features: ["KPI cards", "Monthly trend"], downloadUrl: "/products/sales-dashboard.pbix", bestseller: true, active: true },
];

export default function AdminShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<Product | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
        if (base) {
          const url = base.endsWith("/api") ? `${base}/settings/public` : `${base}/api/settings/public`;
          const res = await fetch(url, { cache: "no-store" });
          if (res.ok) {
            const rows = await res.json();
            const shopRow = rows.find((r: any) => r.key === "shop_products_json");
            if (shopRow?.effectiveValue) {
              const parsed = typeof shopRow.effectiveValue === "string" ? JSON.parse(shopRow.effectiveValue) : shopRow.effectiveValue;
              if (Array.isArray(parsed) && parsed.length > 0) { setProducts(parsed); return; }
            }
          }
        }
      } catch { }
      const saved = localStorage.getItem("tmg_shop_products");
      if (saved) setProducts(JSON.parse(saved));
      else setProducts(DEFAULTS);
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    localStorage.setItem("tmg_shop_products", JSON.stringify(products));
    try {
      const base = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
      if (base) {
        const url = base.endsWith("/api") ? `${base}/settings` : `${base}/api/settings`;
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token") || localStorage.getItem("admin_token") || ""}` },
          body: JSON.stringify({ key: "shop_products_json", value: JSON.stringify(products), isPublic: true })
        });
      }
    } catch { }
    alert("✅ Saved! /shop will update in 30 sec");
    setSaving(false);
  };

  const addProduct = () => {
    setProducts([...products, {
      id: `prod-${Date.now()}`, title: "New Product", description: "Write description", price: 19, currency: "USD", category: "Excel Template", features: ["Feature 1"], downloadUrl: "", bestseller: false, active: true
    }]);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black">Shop Admin</h1>
      <p className="opacity-70 mt-2">Edit prices in USD, add services, preview before posting.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={addProduct} className="px-4 py-2 bg-black text-white rounded font-bold">+ Add Product / Service</button>
        <button onClick={save} disabled={saving} className="px-6 py-2 font-bold rounded text-black bg-yellow-500">{saving ? "Saving..." : "SAVE ALL - Publish to Shop"}</button>
        <a href="/shop" target="_blank" className="px-4 py-2 bg-white border rounded font-bold">View Live Shop →</a>
      </div>

      <div className="mt-8 grid gap-4">
        {products.map((p, i) => (
          <div key={p.id} className="border p-4 rounded bg-white grid md:grid-cols-2 gap-3">
            <input value={p.title} onChange={e => { const c = [...products]; c[i].title = e.target.value; setProducts(c); }} className="border p-2 rounded font-bold" placeholder="Title" />
            <div className="flex gap-2">
              <input value={p.price} type="number" onChange={e => { const c = [...products]; c[i].price = Number(e.target.value); setProducts(c); }} className="border p-2 rounded w-24" placeholder="Price USD" />
              <span className="py-2 font-bold">USD</span>
              <button onClick={() => setPreview(p)} className="ml-auto px-3 py-2 bg-slate-100 rounded text-xs font-bold">👁 Preview</button>
            </div>
            <input value={p.category} onChange={e => { const c = [...products]; c[i].category = e.target.value; setProducts(c); }} className="border p-2 rounded" placeholder="Category: Excel Template, Power BI, Service, Bundle" />
            <input value={p.downloadUrl || ""} onChange={e => { const c = [...products]; c[i].downloadUrl = e.target.value || null; setProducts(c); }} className="border p-2 rounded" placeholder="Download link (empty = service via WhatsApp)" />
            <textarea value={p.description} onChange={e => { const c = [...products]; c[i].description = e.target.value; setProducts(c); }} className="border p-2 rounded col-span-2" placeholder="Description" />
            <input value={p.features.join(", ")} onChange={e => { const c = [...products]; c[i].features = e.target.value.split(",").map(s => s.trim()); setProducts(c); }} className="border p-2 rounded col-span-2" placeholder="Features comma separated" />
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={!!p.bestseller} onChange={e => { const c = [...products]; c[i].bestseller = e.target.checked; setProducts(c); }} /> Bestseller</label>
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={p.active !== false} onChange={e => { const c = [...products]; c[i].active = e.target.checked; setProducts(c); }} /> Active (show)</label>
            <button onClick={() => setProducts(products.filter((_, idx) => idx !== i))} className="text-red-600 text-sm font-bold col-span-2 text-left">🗑 Delete</button>
          </div>
        ))}
      </div>

      {/* PREVIEW MODAL */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={() => setPreview(null)}>
          <div className="bg-white p-5 rounded-xl max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            {preview.bestseller && <div className="inline-block text-xs font-bold px-2 py-1 rounded mb-3 bg-yellow-400">BESTSELLER</div>}
            <div className="h-32 bg-slate-100 rounded-lg mb-4 flex items-center justify-center font-bold opacity-50">{preview.category}</div>
            <div className="text-xs font-bold uppercase text-yellow-600">{preview.category}</div>
            <h3 className="font-bold text-lg mt-2">{preview.title}</h3>
            <p className="text-sm mt-2 opacity-70">{preview.description}</p>
            <div className="mt-4 font-black text-2xl">${preview.price} USD</div>
            <button onClick={() => setPreview(null)} className="mt-4 w-full py-2 bg-black text-white rounded font-bold">Close Preview</button>
          </div>
        </div>
      )}
    </div>
  );
}