"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/content-management";

type Product = { id: string; title: string; description: string; price: number; currency: string; category: string; features: string[]; downloadUrl: string | null; bestseller?: boolean; active: boolean; };

const DEFAULT = { id: "", title: "", description: "", price: 19, currency: "USD", category: "Excel Template", features: "", downloadUrl: "", bestseller: false, active: true };

export default function ShopAdminPage() {
  const [token, setToken] = useState(""); const [products, setProducts] = useState<Product[]>([]); const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [saving, setSaving] = useState(false); const [uploadingId, setUploadingId] = useState<string | null>(null);
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
  async function uploadFile(productId: string, file: File) {
    setUploadingId(productId); setError(""); setNotice("");
    try {
      const base = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || "";
      const uploadUrl = base.endsWith("/api") ? `${base}/media/upload` : `${base}/api/media/upload`;
      const form = new FormData();
      form.append("file", file);
      form.append("publishingLocation", "shop-product");
      form.append("title", file.name);
      const res = await fetch(uploadUrl, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      if (!res.ok) { const txt = await res.text(); throw new Error(txt || "Upload failed"); }
      const data = await res.json();
      const url = data.url || data.publicUrl || data.fileUrl || data.path || `/media/${data.id || file.name}`;
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, downloadUrl: url } : p));
      setNotice(`✅ Uploaded ${file.name} → URL set. Click Save to publish live.`);
    } catch (e:any) { setError(e?.message || "Upload failed. Try Media Library then paste URL."); } finally { setUploadingId(null); }
  }
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex justify-between"><div><p className="text-xs uppercase text-[#8A6A00]">Content</p><h1 className="text-3xl font-bold">Shop Products - Admin (With Upload)</h1><p className="text-sm text-zinc-500 mt-2">Add product → Upload file → Check Active → Save → Client gets file via PayPal/WhatsApp</p></div><Link href="/admin/content" className="rounded border px-4 py-2 font-semibold">Menu</Link></div>
      {(error||notice) && <p className={`mt-6 rounded p-4 text-sm ${error?"bg-red-50 text-red-800 border border-red-200":"bg-green-50 text-green-800 border border-green-200"}`}>{error||notice}</p>}
      <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
        <b>HOW CLIENT RECEIVES FILE:</b><br/>
        1. Upload your .xlsx / .pbix / .zip file below → system creates download URL<br/>
        2. Client pays on /shop via PayPal → you get WhatsApp screenshot → you send file OR they click Download if you enabled auto-download<br/>
        3. You can also put file in <Link href="/admin/content/media" className="underline font-bold">Media Library</Link> → copy its URL → paste in Download URL field
      </div>
      <div className="mt-8 space-y-6">
        <div className="flex justify-between"><h2 className="font-bold">Products ({products.length})</h2><button onClick={add} className="rounded border px-3 py-2 text-sm font-bold">+ Add Product</button></div>
        {products.length===0 && <div className="rounded-xl border border-dashed p-8 text-center bg-white"><p className="font-semibold">No products yet - correct, no fake</p><p className="text-sm text-zinc-500 mt-1">Click + Add to create your first real product</p></div>}
        {products.map((p, idx)=>(
          <fieldset key={p.id} className="rounded-2xl border bg-white p-5 grid gap-3 md:grid-cols-2">
            <legend className="px-2 text-sm font-bold">Product {idx+1} - ID: {p.id}</legend>
            <label className="text-sm font-medium">Title<input value={p.title} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x,title:e.target.value}:x))} className="mt-1 w-full rounded border p-2" placeholder="Real product title" /></label>
            <label className="text-sm font-medium">Category<select value={p.category} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x,category:e.target.value}:x))} className="mt-1 w-full rounded border p-2"><option>Excel Template</option><option>Power BI</option><option>Bundle</option><option>Service</option><option>Consulting Kit</option></select></label>
            <label className="text-sm font-medium md:col-span-2">Description<textarea rows={2} value={p.description} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x,description:e.target.value}:x))} className="mt-1 w-full rounded border p-2" /></label>
            <label className="text-sm font-medium">Price<input type="number" value={p.price} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x,price:Number(e.target.value)}:x))} className="mt-1 w-full rounded border p-2" /></label>
            <label className="text-sm font-medium">Currency<input value={p.currency} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x,currency:e.target.value}:x))} className="mt-1 w-full rounded border p-2" /></label>
            <label className="text-sm font-medium">Features (comma separated)<input value={p.features.join(", ")} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x,features:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)}:x))} className="mt-1 w-full rounded border p-2" placeholder="Auto alerts, Report" /></label>
            <div className="text-sm font-medium">
              <div>Download File (Upload)</div>
              <div className="mt-1 flex gap-2">
                <input type="file" accept=".xlsx,.xls,.pbix,.zip,.pdf,.csv" onChange={e=>{ const f=e.target.files?.[0]; if(f) uploadFile(p.id,f); }} className="w-full rounded border p-1.5 text-xs" />
                {uploadingId===p.id && <span className="text-xs">Uploading...</span>}
              </div>
              <input value={p.downloadUrl||""} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x,downloadUrl:e.target.value||null}:x))} className="mt-2 w-full rounded border p-2 text-xs" placeholder="URL after upload appears here - /media/xxx.xlsx" />
              {p.downloadUrl && <a href={p.downloadUrl} target="_blank" className="text-xs text-blue-700 underline">Test Download Link</a>}
            </div>
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
        <p className="text-xs text-zinc-500">Services cards: Edit in /admin/content/homepage → Services section → Add/Edit/Delete → Shows on homepage Services section. You asked about services → that is where.</p>
      </div>
    </main>
  );
}
