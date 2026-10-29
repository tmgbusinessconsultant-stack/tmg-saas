export const dynamic = 'force-dynamic';
import ShopClient from './shop-client';

export const metadata = {
  title: "Shop Templates | TMG Business Consulting",
  description: "Buy Excel templates, Power BI dashboards, and business tools.",
};

async function loadShopProducts() {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
    if (!base) return [];
    const url = base.endsWith("/api") ? `${base}/settings/public` : `${base}/api/settings/public`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const rows = await res.json();
    const shopRow = rows.find((r: any) => r.key === "shop_products_json" || r.key === "tmg_shop_products");
    if (!shopRow?.effectiveValue) return []; // No admin row = empty, no fake
    try {
      const parsed = typeof shopRow.effectiveValue === "string" ? JSON.parse(shopRow.effectiveValue) : shopRow.effectiveValue;
      if (Array.isArray(parsed)) return parsed.filter((p: any) => p.active !== false);
      return [];
    } catch { return []; }
  } catch { return []; }
}

export default async function ShopPage() {
  const products = await loadShopProducts();
  return <ShopClient products={products} />;
}
