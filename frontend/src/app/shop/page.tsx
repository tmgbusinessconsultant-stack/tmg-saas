import ShopClient from "./shop-client";
export const dynamic = "force-dynamic";

async function loadShopProducts() {
  try {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").trim().replace(/\/+$/, "");
    const base = apiBase.endsWith("/api") ? apiBase : `${apiBase}/api`;
    const res = await fetch(`${base}/settings/public`, { cache: "no-store" });
    const data = await res.json();
    const rows: any[] = Array.isArray(data) ? data : (data.settings || data || []);
    const shopRow = rows.find((r:any)=>r.key==="shop_products_json");
    const titleRow = rows.find((r:any)=>r.key==="shop_title");
    const subtitleRow = rows.find((r:any)=>r.key==="shop_subtitle");

    let products:any[] = [];
    if (shopRow?.effectiveValue) { 
      try { 
        const parsed = typeof shopRow.effectiveValue === 'string' ? JSON.parse(shopRow.effectiveValue) : shopRow.effectiveValue;
        products = Array.isArray(parsed) ? parsed : [];
      } catch {} 
    }
    // also support direct value
    if (shopRow?.dbValue && products.length===0) {
      try {
        const parsed = typeof shopRow.dbValue === 'string' ? JSON.parse(shopRow.dbValue) : shopRow.dbValue;
        products = Array.isArray(parsed) ? parsed : [];
      } catch {}
    }

    const filtered = products.filter((p:any)=>{
      const t=(p.type||"").toUpperCase(); const c=(p.category||"").toLowerCase();
      if (t==="SERVICE") return false;
      if (c.includes("service")||c.includes("consulting")) return false;
      return p.active!==false;
    });

    const title = titleRow?.effectiveValue || titleRow?.dbValue || "TMG Digital Store";
    const subtitle = subtitleRow?.effectiveValue || subtitleRow?.dbValue || "Tools, Templates, Designs & Resources - Instant Download";
    return { products: filtered, title, subtitle };
  } catch(e){ console.error("shop load error", e); return { products: [], title: "TMG Digital Store", subtitle: "Tools, Templates, Designs & Resources" }; }
}
export default async function ShopPage() {
  const { products, title, subtitle } = await loadShopProducts();
  return <ShopClient products={products} title={title} subtitle={subtitle} />;
}
