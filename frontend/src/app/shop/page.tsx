// c:\tmg-saas\frontend\app\shop\page.tsx
import React from "react";
import ShopClient from "./shop-client";

export const dynamic = "force-dynamic";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  type: string;
  active: boolean;
  icon?: string;
}

interface ShopData {
  products: Product[];
  title: string;
  subtitle: string;
}

async function loadShopProducts(): Promise<ShopData> {
  try {
    // Standardize URL parsing to guarantee structural endpoint routing integrity
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").trim().replace(/\/+$/, "");
    const base = apiBase.endsWith("/api") ? apiBase : `${apiBase}/api`;

    const res = await fetch(`${base}/settings/public`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP fetch error code: ${res.status}`);

    const data = await res.json();
    const rows: any[] = Array.isArray(data) ? data : (data.settings || data || []);

    const shopRow = rows.find((r: any) => r.key === "shop_products_json");
    const titleRow = rows.find((r: any) => r.key === "shop_title");
    const subtitleRow = rows.find((r: any) => r.key === "shop_subtitle");

    let products: any[] = [];
    const targetSource = shopRow?.effectiveValue || shopRow?.dbValue;

    if (targetSource) {
      try {
        products = typeof targetSource === "string" ? JSON.parse(targetSource) : targetSource;
      } catch (parseError) {
        console.error("Critical target array extraction mismatch:", parseError);
      }
    }

    // Advanced filtering pipeline separating products from business consulting options
    const filteredProducts: Product[] = (Array.isArray(products) ? products : [])
      .filter((p: any) => {
        if (!p || p.active === false) return false;
        const typeNormalized = (p.type || "").toUpperCase();
        const catNormalized = (p.category || "").toLowerCase();

        return (
          typeNormalized !== "SERVICE" &&
          !catNormalized.includes("service") &&
          !catNormalized.includes("consulting")
        );
      })
      .map((p: any) => ({
        id: p.id || Math.random().toString(36).substring(2, 9),
        title: p.title || "Premium Digital Asset",
        description: p.description || "No summary overview context provided.",
        price: Number(p.price) || 0,
        category: p.category || "General Resources",
        type: p.type || "DIGITAL",
        active: true,
        icon: p.icon || "📦"
      }));

    return {
      products: filteredProducts,
      title: titleRow?.effectiveValue || titleRow?.dbValue || "TMG Digital Store",
      subtitle: subtitleRow?.effectiveValue || subtitleRow?.dbValue || "Tools, Templates, Designs & Resources - Instant Download"
    };
  } catch (e: any) {
    console.error("Shop page build load execution error:", e.message);
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
