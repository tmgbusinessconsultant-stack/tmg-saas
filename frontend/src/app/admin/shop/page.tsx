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
  { id: "excel-inventory-pro", title: "Inventory Tracker Pro - Excel", description: "Track stock, sales, low stock alerts.", price: 14, currency: "USD", category: "Excel Template", features: ["Auto stock alerts","Sales report"], downloadUrl: "/products/inventory.xlsx", bestseller: true, active: true },
  { id: "sales-dashboard-pbi", title: "Sales Dashboard - Power BI", description: "CEO dashboard", price: 40, currency: "USD", category: "Power BI", features: ["KPI cards","Monthly trend"], downloadUrl: "/products/sales-dashboard.pbix", bestseller: true, active: true },
];

export default function AdminShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      // 1. Try backend first (same key shop page uses)
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
              if (Array.isArray(parsed) && parsed.length > 0) {
                setProducts(parsed);
                return;
              }
            }
          }
        }
      } catch {}
      // 2. Fallback localStorage
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
    } catch (e) { console.log(e); }
    alert("✅ Saved! Public /shop will update in 30 sec. Also saved locally.");
    setSaving(false);
  };

  const addProduct = () => {
    setProducts([...products, {
      id: `prod-${Date.now()}`, title: "New Product", description: "Write description", price: 19, currency: "USD", category: "Excel Template", features: ["Feature 1"], downloadUrl: "", bestseller: false, active: true
    }]);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto" style={{ background: "var(--background)" }}>
      <h1 className="text-3xl font-black">Shop Admin - Edit Products</h1>
      <p className="opacity-70 mt-2">This controls your public /shop page. Prices in USD.</p>
      <div className="mt-6 flex gap-3">
        <button onClick={addProduct} className="px-4 py-2 bg-black text-white rounded font-bold">+ Add Product</button>
        <button onClick={save} disabled={saving} className="px-6 py-2 font-bold rounded text-black" style={{ background: "var(--gold)" }}>{saving ? "Saving..." : "SAVE ALL"}</button>
      </div>
      <div className="mt-8 grid gap-4">
        {products.map((p, i) => (
          <div key={p.id} className="border p-4 rounded bg-white grid md:grid-cols-2 gap-3" style={{ borderColor: "var(--border-color)" }}>
            <input value={p.title} onChange={e=>{ const c=[...products]; c[i].title=e.target.value; setProducts(c); }} className="border p-2 rounded font-bold" placeholder="Title" />
            <input value={p.price} type="number" onChange={e=>{ const c=[...products]; c[i].price=Number(e.target.value); setProducts(c); }} className="border p-2 rounded" placeholder="Price USD" />
            <input value={p.category} onChange={e=>{ const c=[...products]; c[i].category=e.target.value; setProducts(c); }} className="border p-2 rounded" placeholder="Category" />
            <input value={p.downloadUrl||""} onChange={e=>{ const c=[...products]; c[i].downloadUrl=e.target.value || null; setProducts(c); }} className="border p-2 rounded" placeholder="Download link" />
            <textarea value={p.description} onChange={e=>{ const c=[...products]; c[i].description=e.target.value; setProducts(c); }} className="border p-2 rounded col-span-2" placeholder="Description" />
            <input value={p.features.join(", ")} onChange={e=>{ const c=[...products]; c[i].features=e.target.value.split(",").map(s=>s.trim()); setProducts(c); }} className="border p-2 rounded col-span-2" placeholder="Features comma separated" />
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={!!p.bestseller} onChange={e=>{ const c=[...products]; c[i].bestseller=e.target.checked; setProducts(c); }} /> Bestseller</label>
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={p.active!==false} onChange={e=>{ const c=[...products]; c[i].active=e.target.checked; setProducts(c); }} /> Active (show on shop)</label>
            <button onClick={()=>setProducts(products.filter((_, idx)=>idx!==i))} className="text-red-600 text-sm font-bold col-span-2 text-left">Delete this product</button>
          </div>
        ))}
      </div>
    </div>
  );
}