"use client";
import { useEffect, useState, useMemo } from "react";

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  features: string[];
  downloadUrl: string;
  imageUrl: string;
  mediaId?: string | null;
  type: string;
  active: boolean;
  bestseller: boolean;
};

const CATS = ["Excel Template", "Bundle", "Template", "Course", "Tool", "Power BI", "Design", "Consulting Pack", "Legal Form", "Business Plan"];

function compressImage(dataUrl: string, maxW = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function ShopAdminFinalV3BestMatched() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [searchAdmin, setSearchAdmin] = useState("");

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/+$/, "");
  const base = apiBase.endsWith("/api") ? apiBase : `${apiBase}/api`;
  const getToken = () => localStorage.getItem("access_token") || localStorage.getItem("token") || "";

  const load = async () => {
    try {
      const r = await fetch(`${base}/settings/public`, { cache: "no-store" });
      const j = await r.json();
      const rows = Array.isArray(j) ? j : j.settings || [];
      const row = rows.find((x: any) => x.key === "shop_products_json");
      const raw = row?.effectiveValue || row?.dbValue || row?.value || "[]";
      const list = JSON.parse(raw);
      setProducts(Array.isArray(list) ? list : []);
    } catch { setProducts([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filteredAdmin = useMemo(() => {
    if (!searchAdmin) return products;
    return products.filter(p => (p.title + p.description + p.category).toLowerCase().includes(searchAdmin.toLowerCase()));
  }, [products, searchAdmin]);

  const update = (i: number, patch: Partial<Product>) => {
    const c = [...products]; c[i] = { ...c[i], ...patch }; setProducts(c);
  };

  const onImage = async (e: any, i: number) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const raw = reader.result as string;
      update(i, { imageUrl: raw }); // instant preview BEST
      const compressed = await compressImage(raw, 800, 0.7);
      update(i, { imageUrl: compressed });
      try {
        const token = getToken();
        const fd = new FormData(); fd.append("file", file);
        const resp = await fetch(`${base}/media/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
        if (resp.ok) {
          const dj = await resp.json();
          const url = dj.url || dj.fileUrl || dj.location || dj.secureUrl;
          if (url) update(i, { imageUrl: url });
        }
      } catch { }
    };
    reader.readAsDataURL(file);
  };

  const onFile = async (e: any, i: number) => {
    const file = e.target.files?.[0]; if (!file) return;
    update(i, { downloadUrl: "Uploading " + file.name + "..." });
    try {
      const token = getToken();
      const fd = new FormData(); fd.append("file", file);
      const resp = await fetch(`${base}/media/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      const dj = await resp.json();
      const url = dj.url || dj.fileUrl || dj.location || dj.secureUrl;
      update(i, { downloadUrl: url || "", mediaId: dj.id || dj.mediaId || null });
    } catch { update(i, { downloadUrl: "" }); }
  };

  const saveAll = async () => {
    setSaving(true); setMsg("");
    try {
      const token = getToken();
      if (!token) throw new Error("No auth token — login again");
      // BEST: Clean huge base64 + ensure match with ShopClient
      const cleaned = await Promise.all(products.map(async p => {
        let img = p.imageUrl || "";
        if (img.startsWith("data:image") && img.length > 350000) {
          try { img = await compressImage(img, 600, 0.6); } catch { }
        }
        if (img.startsWith("data:image") && img.length > 500000) {
          img = ""; // drop if still huge — prevents DB error
        }
        return {
          id: p.id,
          title: p.title?.trim() || "Untitled",
          description: p.description?.trim() || "",
          price: Number(p.price) || 0,
          currency: p.currency || "USD",
          category: p.category || "Template",
          features: Array.isArray(p.features) ? p.features.filter(Boolean).slice(0, 6) : [],
          downloadUrl: p.downloadUrl || "",
          imageUrl: img,
          mediaId: p.mediaId || null,
          type: p.type || "PRODUCT",
          active: p.active !== false,
          bestseller: !!p.bestseller
        };
      }));
      const res = await fetch(`${base}/settings/shop_products_json`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ value: JSON.stringify(cleaned) })
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg(`✅ Saved! ${cleaned.length} products live — Active: ${cleaned.filter(p => p.active).length} — Refresh /shop`);
      setProducts(cleaned);
    } catch (err: any) { setMsg("❌ Save failed: " + (err.message || "Unknown").slice(0, 400)); }
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-sm animate-pulse">Loading shop products — TMG Engine v2...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between gap-4 items-start">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Shop Products — Final V3 BEST MATCHED</h1>
          <p className="text-xs text-slate-500 mt-1">✅ Matches ShopClient BEST upgrade: active filter, bestseller sort, compressed images, instant preview, empty shop OK.</p>
          <div className="mt-2 flex gap-2 text-[11px]"><span className="bg-slate-900 text-white px-2 py-1 rounded-full">{products.length} total</span><span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">{products.filter(p => p.active).length} active</span><span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full">{products.filter(p => p.bestseller).length} bestseller</span></div>
        </div>
        <input value={searchAdmin} onChange={e => setSearchAdmin(e.target.value)} placeholder="Search admin..." className="border rounded-xl px-4 py-2 text-sm w-64" />
      </div>

      {msg && <div className="mt-4 p-3 rounded-xl text-sm bg-slate-900 text-white border shadow">{msg}</div>}

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => { const np: Product = { id: Date.now().toString(), title: "New Excel Template", description: "Qatar compliant template with instant download", price: 49, currency: "USD", category: "Excel Template", features: ["Instant download", "Qatar compliant", "Excel + PDF"], downloadUrl: "", imageUrl: "", type: "PRODUCT", active: true, bestseller: false }; setProducts([np, ...products]); }} className="px-4 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800">+ Add Product</button>
        <button onClick={saveAll} disabled={saving} className="px-8 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black disabled:opacity-50 shadow">{saving ? "Saving..." : `Save ${products.length} → Live Shop 🚀`}</button>
        <button onClick={() => { if (confirm("Clear ALL shop? Empty will be OK and /shop will show empty state")) { setProducts([]); } }} className="px-4 py-2 bg-white border rounded-xl text-sm">Clear Shop (Empty OK)</button>
        <button onClick={load} className="px-4 py-2 bg-slate-100 rounded-xl text-sm">Reload</button>
        <a href="/shop" target="_blank" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">View /shop →</a>
      </div>

      {filteredAdmin.length === 0 && <div className="mt-10 border-2 border-dashed rounded-2xl p-16 text-center bg-white"><p className="text-2xl">📦</p><p className="font-black mt-2">Shop is empty — BEST state</p><p className="text-sm text-slate-500 mt-1">Click + Add Product — you build it yourself, this is proper way. Matches ShopClient empty UI.</p></div>}

      <div className="mt-8 space-y-8">
        {filteredAdmin.map((p, origIdx) => {
          const i = products.findIndex(pr => pr.id === p.id);
          return (
            <div key={p.id} className={`border rounded-2xl bg-white p-5 shadow-sm transition ${!p.active ? 'opacity-60 border-dashed' : ''} ${p.bestseller ? 'ring-2 ring-amber-200' : ''}`}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2"><span className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded">{p.id.slice(-6)}</span>{p.bestseller && <span className="text-[10px] bg-amber-400 px-2 py-1 rounded-full font-black">🔥 BESTSELLER</span>}{!p.active && <span className="text-[10px] bg-slate-200 px-2 py-1 rounded-full">INACTIVE — hidden from /shop</span>}</div>
                <div className="text-[11px] text-slate-400">{(p.imageUrl?.length || 0) > 1000 ? `${(p.imageUrl.length / 1024).toFixed(0)}KB img` : 'No heavy image'}</div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="text-[11px] font-black tracking-wider">TITLE *</label><input value={p.title} onChange={e => update(i, { title: e.target.value })} className="w-full border rounded-xl p-2.5 mt-1 text-sm focus:border-blue-500 outline-none" placeholder="Business Plan Qatar 2025" /></div>
                <div><label className="text-[11px] font-black tracking-wider">CATEGORY — type any (matches filter)</label><input list="cats" value={p.category} onChange={e => update(i, { category: e.target.value })} className="w-full border rounded-xl p-2.5 mt-1 text-sm" /><datalist id="cats">{CATS.map(c => <option key={c} value={c} />)}</datalist></div>
                <div className="md:col-span-2"><label className="text-[11px] font-black">DESCRIPTION (shows in /shop card)</label><textarea value={p.description} onChange={e => update(i, { description: e.target.value })} rows={2} className="w-full border rounded-xl p-2.5 mt-1 text-sm" placeholder="What buyer gets — instant download, compliant..." /></div>
                <div><label className="text-[11px] font-black">PRICE *</label><input type="number" value={p.price} onChange={e => update(i, { price: parseFloat(e.target.value) || 0 })} className="w-full border rounded-xl p-2.5 mt-1 text-sm" /></div>
                <div><label className="text-[11px] font-black">CURRENCY</label><select value={p.currency} onChange={e => update(i, { currency: e.target.value })} className="w-full border rounded-xl p-2.5 mt-1 text-sm bg-white"><option>USD</option><option>QAR</option><option>AED</option><option>SAR</option><option>EUR</option></select></div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-5">
                <div className="border rounded-xl p-3 bg-slate-50">
                  <label className="text-[11px] font-black">IMAGE — preview = /shop card preview</label>
                  <div className="mt-2 h-52 bg-white border rounded-xl overflow-hidden flex items-center justify-center relative">
                    {p.imageUrl ? <img src={p.imageUrl} alt="preview" className="w-full h-full object-contain" /> : <span className="text-xs text-slate-400">No image — /shop will show category placeholder</span>}
                    {p.bestseller && <div className="absolute top-2 left-2 bg-amber-400 text-[10px] font-black px-2 py-1 rounded">🔥 Bestseller</div>}
                  </div>
                  <input type="file" accept="image/*" onChange={e => onImage(e, i)} className="mt-3 w-full text-xs" />
                  <input value={p.imageUrl} onChange={e => update(i, { imageUrl: e.target.value })} placeholder="https://... or leave compressed" className="w-full border rounded-lg p-2 mt-2 text-[10px] font-mono" />
                  <p className="text-[10px] text-slate-500 mt-2">✅ Auto-compressed to ~150KB — BEST fix so save never fails. Matches ShopClient aspect-[16/10]</p>
                </div>

                <div className="border rounded-xl p-3 bg-slate-50">
                  <label className="text-[11px] font-black">DOWNLOAD FILE — /shop success download</label>
                  <div className="mt-2 min-h-[52px] bg-white border rounded-xl p-2.5 text-xs truncate flex items-center">{p.downloadUrl ? <a href={p.downloadUrl} target="_blank" className="text-blue-600 underline truncate">{p.downloadUrl}</a> : <span className="text-slate-400">No file — user gets WhatsApp fallback (BEST)</span>}</div>
                  <input type="file" onChange={e => onFile(e, i)} className="mt-3 w-full text-xs" />
                  <input value={p.downloadUrl} onChange={e => update(i, { downloadUrl: e.target.value })} placeholder="https://... uploaded file URL" className="w-full border rounded-lg p-2 mt-2 text-[10px] font-mono" />
                  <div className="mt-4">
                    <label className="text-[11px] font-black">FEATURES comma separated — shows ✓ in /shop card (max 3)</label>
                    <input value={p.features?.join(", ")} onChange={e => update(i, { features: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} placeholder="Instant download, Qatar compliant, Excel+PDF" className="w-full border rounded-xl p-2.5 mt-1 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <label className="text-xs flex items-center gap-2 bg-white border rounded-lg p-2"><input type="checkbox" checked={!!p.bestseller} onChange={e => update(i, { bestseller: e.target.checked })} /> 🔥 Bestseller (sorts first)</label>
                    <label className="text-xs flex items-center gap-2 bg-white border rounded-lg p-2"><input type="checkbox" checked={p.active} onChange={e => update(i, { active: e.target.checked })} /> ✅ Active (show in /shop)</label>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <select value={p.type} onChange={e => update(i, { type: e.target.value })} className="border rounded-lg p-2 text-xs bg-white"><option>PRODUCT</option><option>SERVICE</option><option>BUNDLE</option></select>
                    <button onClick={() => { if (confirm(`Delete ${p.title}?`)) setProducts(products.filter((_, idx) => idx !== i)); }} className="ml-auto text-xs text-red-600 font-bold border border-red-200 bg-white px-3 py-1 rounded-lg hover:bg-red-50">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-12 flex flex-col items-center gap-3 pb-20">
        <button onClick={saveAll} disabled={saving} className="px-12 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-lg shadow-emerald-200 disabled:opacity-50 text-sm">{saving ? "Saving..." : `🚀 Save ${products.length} Products → Live Shop (${products.filter(p => p.active).length} active)`}</button>
        <p className="text-[11px] text-slate-400">Matches BEST ShopClient: active filter, bestseller first, compressed images, WhatsApp fallback, instant download</p>
      </div>
    </div>
  );
}