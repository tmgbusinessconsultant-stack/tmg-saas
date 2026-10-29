"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/content-management";

type Product = { id: string; title: string; description: string; price: number; currency: string; category: string; features: string[]; downloadUrl: string | null; bestseller?: boolean; active: boolean; };

const DEFAULT = { id: "", title: "", description: "", price: 19, currency: "USD", category: "Excel Template", features: "", downloadUrl: "", bestseller: false, active: true };

export default function ShopAdminPage() {
  const [token, setToken] = useState(""); const [products, setProducts] = useState<Product[]>([]); const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [saving, setSaving] = useState(false);
  useEffect(() => {
    const t = sessionStorage.getItem("accessToken") || localStorage.getItem("token") || ""; if (!t) { setError("Login as admin first /admin"); return; } setToken(t);
    void apiRequest<any[]>("/settings/public", t).then(rows => {
      const row = rows.find((r:any)=>r.key==="shop_products_json" || r.key==="tmg_shop_products");
      if (row?.effectiveValue) { try { const parsed = typeof row.effectiveValue === "string" ? JSON.parse(row.effectiveValue) : row.effectiveValue; if (Array.isArray(parsed)) setProducts(parsed); } catch {} }
    }).catch(()=>{});
  }, []);
  async function save() {
    setSaving(true); setError(""); setNotice("");
    try {
      await apiRequest("/settings", token, { method: "POST", body: JSON.stringify({ key: "shop_products_json", value: JSON.stringify(products), isPublic: true }) });
      setNotice("✅ Shop products saved - Live on /shop in 30 sec. Empty allowed - you control all.");
    } catch (e:any) { setError(e?.message || "Save failed"); } finally { setSaving(false); }
  }
  function add() { const id = Date.now().toString(); setProducts([...products, { ...DEFAULT as any, id, features: [], downloadUrl: null } as Product]); }
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex justify-between"><div><p className="text-xs uppercase text-[#8A6A00]">Content</p><h1 className="text-3xl font-bold">Shop Products - Admin</h1><p className="text-sm text-zinc-500 mt-2">Even empty works - you can Add / Edit / Approve (active) / Delete - Live on /shop</p></div><Link href="/admin/content" className="rounded border px-4 py-2 font-semibold">Menu</Link></div>
      {(error||notice) && <p className={`mt-6 rounded p-4 text-sm ${error?"bg-red-50 text-red-800":"bg-green-50 text-green-800"}`}>{error||notice}</p>}
      <div className="mt-8 space-y-6">
        <div className="flex justify-between"><h2 className="font-bold">Products ({products.length})</h2><button onClick={add} className="rounded border px-3 py-2 text-sm font-bold">+ Add Product</button></div>
        {products.length===0 && <div className="rounded-xl border border-dashed p-8 text-center bg-white"><p className="font-semibold">No products yet - correct, no fake</p><p className="text-sm text-zinc-500 mt-1">Click + Add to create your first real product, set active=true to show</p></div>}
        {products.map((p, idx)=>(
          <fieldset key={p.id} className="rounded-2xl border bg-white p-5 grid gap-3 md:grid-cols-2">
            <legend className="px-2 text-sm font-bold">Product {idx+1} - ID: {p.id}</legend>
            <label className="text-sm font-medium">Title<input value={p.title} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x,title:e.target.value}:x))} className="mt-1 w-full rounded border p-2" placeholder="Real product title" /></label>
            <label className="text-sm font-medium">Category<input value={p.category} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x,category:e.target.value}:x))} className="mt-1 w-full rounded border p-2" /></label>
            <label className="text-sm font-medium md:col-span-2">Description<textarea rows={2} value={p.description} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x,description:e.target.value}:x))} className="mt-1 w-full rounded border p-2" /></label>
            <label className="text-sm font-medium">Price<input type="number" value={p.price} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x,price:Number(e.target.value)}:x))} className="mt-1 w-full rounded border p-2" /></label>
            <label className="text-sm font-medium">Currency<input value={p.currency} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x,currency:e.target.value}:x))} className="mt-1 w-full rounded border p-2" /></label>
            <label className="text-sm font-medium">Features (comma separated)<input value={p.features.join(", ")} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x,features:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)}:x))} className="mt-1 w-full rounded border p-2" placeholder="Auto alerts, Report" /></label>
            <label className="text-sm font-medium">Download URL<input value={p.downloadUrl||""} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x,downloadUrl:e.target.value||null}:x))} className="mt-1 w-full rounded border p-2" placeholder="/products/file.xlsx or https://" /></label>
            <div className="md:col-span-2 flex justify-between items-center mt-2">
              <div className="flex gap-4">
                <label className="flex gap-2 text-sm font-bold"><input type="checkbox" checked={p.active} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x,active:e.target.checked}:x))} /> Active - Show live</label>
                <label className="flex gap-2 text-sm"><input type="checkbox" checked={!!p.bestseller} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x,bestseller:e.target.checked}:x))} /> Bestseller</label>
              </div>
              <button type="button" onClick={()=>setProducts(products.filter(x=>x.id!==p.id))} className="text-sm text-red-700 underline">Delete</button>
            </div>
          </fieldset>
        ))}
        <button onClick={save} disabled={saving || !token} className="rounded bg-black text-white px-6 py-3 font-bold disabled:opacity-50">{saving?"Saving...":"Save Shop - Publish Live"}</button>
      </div>
    </main>
  );
}
