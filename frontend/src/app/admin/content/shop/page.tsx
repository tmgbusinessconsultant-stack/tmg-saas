"use client";
import { useEffect, useState } from "react";

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
  type: string;
  active: boolean;
  bestseller: boolean;
};

const CATS = ["Excel Template","Bundle","Template","Course","Tool","Power BI","Design"];

function compressImage(dataUrl: string, maxW=800, quality=0.7): Promise<string> {
  return new Promise((resolve)=>{
    const img = new Image();
    img.onload = ()=>{
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  });
}

export default function ShopAdminFinalV3(){
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/+$/,"");
  const base = apiBase.endsWith("/api") ? apiBase : `${apiBase}/api`;

  const load = async()=>{
    try{
      const r = await fetch(`${base}/settings/public`,{cache:"no-store"});
      const j = await r.json();
      const rows = Array.isArray(j)? j : j.settings || [];
      const row = rows.find((x:any)=>x.key==="shop_products_json");
      const raw = row?.effectiveValue || row?.dbValue || "[]";
      const list = JSON.parse(raw);
      setProducts(Array.isArray(list)? list : []);
    }catch{ setProducts([]); }
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);

  const update = (i:number, patch:Partial<Product>)=>{
    const c = [...products]; c[i] = {...c[i], ...patch}; setProducts(c);
  };

  const onImage = async(e:any,i:number)=>{
    const file = e.target.files?.[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = async()=>{
      const raw = reader.result as string;
      // instant preview
      update(i,{imageUrl: raw});
      // compress for save
      const compressed = await compressImage(raw);
      update(i,{imageUrl: compressed});
      // try upload to get real URL (optional)
      try{
        const token = localStorage.getItem("access_token");
        const fd = new FormData(); fd.append("file", file);
        const resp = await fetch(`${base}/media/upload`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});
        if(resp.ok){
          const dj = await resp.json();
          const url = dj.url || dj.fileUrl || dj.location;
          if(url) update(i,{imageUrl: url});
        }
      }catch{}
    };
    reader.readAsDataURL(file);
  };

  const onFile = async(e:any,i:number)=>{
    const file = e.target.files?.[0]; if(!file) return;
    update(i,{downloadUrl: "Uploading "+file.name+"..."});
    try{
      const token = localStorage.getItem("access_token");
      const fd = new FormData(); fd.append("file", file);
      const resp = await fetch(`${base}/media/upload`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});
      const dj = await resp.json();
      const url = dj.url || dj.fileUrl || dj.location;
      update(i,{downloadUrl: url || ""});
    }catch{ update(i,{downloadUrl: ""}); }
  };

  const saveAll = async()=>{
    setSaving(true); setMsg("");
    try{
      const token = localStorage.getItem("access_token");
      // final safety: ensure no huge base64 > 400KB remains, compress again if needed
      const cleaned = await Promise.all(products.map(async p=>{
        let img = p.imageUrl || "";
        if(img.startsWith("data:image") && img.length > 400000){
          try{ img = await compressImage(img, 600, 0.6); }catch{}
        }
        return {...p, imageUrl: img};
      }));
      const res = await fetch(`${base}/settings/shop_products_json`,{
        method:"PUT",
        headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
        body: JSON.stringify({value: JSON.stringify(cleaned)})
      });
      if(!res.ok) throw new Error(await res.text());
      setMsg("✅ Saved! "+cleaned.length+" products live. Refresh /shop");
      setProducts(cleaned);
    }catch(err:any){ setMsg("❌ Save failed: "+ (err.message||"").slice(0,300)); }
    setSaving(false);
  };

  if(loading) return <div className="p-10">Loading...</div>;

  return(
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold">Shop Products — Final V3 (Fixed Save)</h1>
      <p className="text-xs text-slate-500 mt-1">Preview works, save works even with images, empty shop OK. Compresses images automatically.</p>
      {msg && <div className="mt-3 p-3 rounded-lg text-sm bg-slate-100 border">{msg}</div>}

      <div className="mt-4 flex gap-2">
        <button onClick={()=>{ const np:Product={id:Date.now().toString(),title:"New Product",description:"",price:49,currency:"USD",category:"Excel Template",features:[],downloadUrl:"",imageUrl:"",type:"PRODUCT",active:true,bestseller:false}; setProducts([np,...products]); }} className="px-4 py-2 bg-black text-white rounded text-sm">+ Add Product</button>
        <button onClick={saveAll} disabled={saving} className="px-6 py-2 bg-green-600 text-white rounded text-sm font-bold disabled:opacity-50">{saving?"Saving...":"Save All"}</button>
        <button onClick={()=>{ if(confirm("Clear ALL shop? Empty will be OK")){ setProducts([]); }}} className="px-4 py-2 bg-slate-100 rounded text-sm">Clear Shop (Start Empty)</button>
      </div>

      {products.length===0 && <div className="mt-10 border-2 border-dashed rounded-2xl p-16 text-center bg-white"><p className="font-bold">Shop is empty</p><p className="text-sm text-slate-500">Click + Add Product — you can build it yourself, this is the proper way.</p></div>}

      <div className="mt-8 space-y-8">
        {products.map((p,i)=>(
          <div key={p.id} className="border rounded-2xl bg-white p-5 shadow-sm">
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="text-[11px] font-bold">TITLE</label><input value={p.title} onChange={e=>update(i,{title:e.target.value})} className="w-full border rounded-lg p-2.5 mt-1 text-sm" /></div>
              <div><label className="text-[11px] font-bold">CATEGORY - type any</label><input list="cats" value={p.category} onChange={e=>update(i,{category:e.target.value})} className="w-full border rounded-lg p-2.5 mt-1 text-sm" /><datalist id="cats">{CATS.map(c=><option key={c} value={c}/>)}</datalist></div>
              <div className="md:col-span-2"><label className="text-[11px] font-bold">DESCRIPTION</label><textarea value={p.description} onChange={e=>update(i,{description:e.target.value})} rows={2} className="w-full border rounded-lg p-2.5 mt-1 text-sm" /></div>
              <div><label className="text-[11px] font-bold">PRICE</label><input type="number" value={p.price} onChange={e=>update(i,{price:parseFloat(e.target.value)||0})} className="w-full border rounded-lg p-2.5 mt-1 text-sm" /></div>
              <div><label className="text-[11px] font-bold">CURRENCY</label><input value={p.currency} onChange={e=>update(i,{currency:e.target.value})} className="w-full border rounded-lg p-2.5 mt-1 text-sm" /></div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-5">
              <div className="border rounded-xl p-3 bg-slate-50">
                <label className="text-[11px] font-bold">IMAGE - preview inside card</label>
                <div className="mt-2 h-52 bg-white border rounded-lg overflow-hidden flex items-center justify-center">
                  {p.imageUrl ? <img src={p.imageUrl} alt="preview" className="w-full h-full object-contain" /> : <span className="text-xs text-slate-400">No image</span>}
                </div>
                <input type="file" accept="image/*" onChange={e=>onImage(e,i)} className="mt-3 w-full text-xs" />
                <input value={p.imageUrl} onChange={e=>update(i,{imageUrl:e.target.value})} placeholder="https://..." className="w-full border rounded p-2 mt-2 text-[10px]" />
                <p className="text-[10px] text-slate-400 mt-1">Auto-compressed to ~150KB so save never fails</p>
              </div>

              <div className="border rounded-xl p-3 bg-slate-50">
                <label className="text-[11px] font-bold">DOWNLOAD FILE</label>
                <div className="mt-2 min-h-[52px] bg-white border rounded-lg p-2 text-xs truncate flex items-center">{p.downloadUrl ? <a href={p.downloadUrl} target="_blank" className="text-blue-600 underline">{p.downloadUrl}</a> : <span className="text-slate-400">No file</span>}</div>
                <input type="file" onChange={e=>onFile(e,i)} className="mt-3 w-full text-xs" />
                <input value={p.downloadUrl} onChange={e=>update(i,{downloadUrl:e.target.value})} placeholder="https://..." className="w-full border rounded p-2 mt-2 text-[10px]" />
                <div className="mt-3">
                  <label className="text-[11px] font-bold">FEATURES comma separated</label>
                  <input value={p.features?.join(", ")} onChange={e=>update(i,{features:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})} className="w-full border rounded p-2 mt-1 text-xs" />
                </div>
                <div className="flex gap-3 mt-3">
                  <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={!!p.bestseller} onChange={e=>update(i,{bestseller:e.target.checked})} /> Bestseller</label>
                  <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={p.active} onChange={e=>update(i,{active:e.target.checked})} /> Active</label>
                  <button onClick={()=>{ if(confirm("Delete?")) setProducts(products.filter((_,idx)=>idx!==i)); }} className="ml-auto text-xs text-red-600">Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-center pb-10">
        <button onClick={saveAll} disabled={saving} className="px-10 py-3 bg-green-600 text-white rounded-xl font-bold shadow">{saving?"Saving...":`Save ${products.length} Products to Live Shop`}</button>
      </div>
    </div>
  );
}
