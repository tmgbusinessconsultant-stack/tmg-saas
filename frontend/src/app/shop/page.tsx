// c:\tmg-saas\frontend\app\shop\page.tsx
import React from "react";
import ShopClient from "./shop-client";
import type { ShopProduct } from "./shop-client";

export const dynamic = "force-dynamic";

interface ShopData {
  products: ShopProduct[];
  title: string;
  subtitle: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

async function loadShopProducts(): Promise<ShopData> {
  try {
    // Standardize URL parsing to guarantee structural endpoint routing integrity
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").trim().replace(/\/+$/, "");
    const base = apiBase.endsWith("/api") ? apiBase : `${apiBase}/api`;

    const res = await fetch(`${base}/settings/public`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`HTTP fetch error code: ${res.status}`);

    const data: unknown = await res.json();
    const rawRows = Array.isArray(data)
      ? data
      : isRecord(data) && Array.isArray(data.settings) ? data.settings : [];
    const rows = rawRows.filter(isRecord);
    const findRow = (key: string) => rows.find(row => row.key === key);
    const shopRow = findRow("shop_products_json");
    const titleRow = findRow("shop_title");
    const subtitleRow = findRow("shop_subtitle");
    const targetSource = shopRow?.effectiveValue ?? shopRow?.dbValue;
    let products: unknown[] = [];

    if (typeof targetSource === "string" || Array.isArray(targetSource)) {
      try {
        const parsed: unknown = typeof targetSource === "string" ? JSON.parse(targetSource) : targetSource;
        if (Array.isArray(parsed)) products = parsed;
        else throw new Error("The shop products setting must contain a JSON array.");
      } catch (parseError) {
        console.error("Critical target array extraction mismatch:", parseError);
      }
    }

    // Advanced filtering pipeline separating products from business consulting options
    const filteredProducts: ShopProduct[] = products.flatMap((product, index) => {
      if (!isRecord(product) || product.active === false) return [];
      const productType = typeof product.type === "string" ? product.type.toUpperCase() : "";
      const category = getText(product.category, "General Resources");
      const normalizedCategory = category.toLowerCase();
      if (productType === "SERVICE" || normalizedCategory.includes("service") || normalizedCategory.includes("consulting")) return [];
      const priceValue = typeof product.price === "number" ? product.price : Number(product.price);

      return [{
        id: getText(product.id, `product-${index + 1}`),
        title: getText(product.title, "Premium Digital Asset"),
        description: getText(product.description, "No summary overview context provided."),
        price: Number.isFinite(priceValue) ? priceValue : 0,
        currency: getText(product.currency, "QAR"),
        category,
        features: Array.isArray(product.features) ? product.features.filter((feature): feature is string => typeof feature === "string") : [],
        downloadUrl: typeof product.downloadUrl === "string" ? product.downloadUrl : null,
        imageUrl: typeof product.imageUrl === "string" ? product.imageUrl : null,
        mediaId: typeof product.mediaId === "string" ? product.mediaId : null,
        type: "PRODUCT",
        active: true,
        bestseller: product.bestseller === true,
      }];
    });

    return {
      products: filteredProducts,
      title: getText(titleRow?.effectiveValue ?? titleRow?.dbValue, "TMG Digital Store"),
      subtitle: getText(subtitleRow?.effectiveValue ?? subtitleRow?.dbValue, "Tools, Templates, Designs & Resources - Instant Download")
    };
  } catch (error: unknown) {
    console.error("Shop page build load execution error:", error);
    return {
      products: [],
      title: "TMG Digital Store",
      subtitle: "Tools, Templates, Designs & Resources"
    };
  }
}

export default async function ShopPage() {
  const { products, title, subtitle } = await loadShopProducts();

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Dynamic Header Component Block Banner matching upgraded Next.js schemas */}
      <header className="bg-white border-b border-slate-100 py-12 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-3">
            {title}
          </h1>
          <p className="text-base md:text-lg text-slate-500 font-medium max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>
      </header>

      {/* Primary Interaction Interface Layout Layer */}
      <main className="max-w-7xl mx-auto px-4 py-12 md:px-8">
        <ShopClient products={products} title={title} subtitle={subtitle} />
      </main>
    </div>
  );
}
