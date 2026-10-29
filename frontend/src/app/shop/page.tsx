export const dynamic = 'force-dynamic';

import ShopClient from './shop-client';

export const metadata = {
  title: "Shop Templates | TMG Business Consulting",
  description: "Buy Excel templates, Power BI dashboards, and business tools.",
};

const DEFAULT_PRODUCTS = [
  {
    id: "excel-inventory-pro",
    title: "Inventory Tracker Pro - Excel",
    description: "Track stock, sales, low stock alerts. For shops & warehouses.",
    price: 14,
    currency: "USD",
    category: "Excel Template",
    features: ["Auto stock alerts", "Sales report", "Supplier tracker"],
    downloadUrl: "/products/inventory.xlsx",
    bestseller: true,
    active: true,
  },
  {
    id: "sales-dashboard-pbi",
    title: "Sales Dashboard - Power BI + Excel",
    description: "CEO dashboard: daily sales, top products, profit.",
    price: 40,
    currency: "USD",
    category: "Power BI",
    features: ["KPI cards", "Monthly trend", "Top 10 products"],
    downloadUrl: "/products/sales-dashboard.pbix",
    bestseller: true,
    active: true,
  },
  {
    id: "salary-payroll",
    title: "Salary & Payroll Sheet - Qatar WPS",
    description: "WPS-ready payroll for 50 staff, auto calculation.",
    price: 22,
    currency: "USD",
    category: "Excel Template",
    features: ["WPS format", "Overtime calc", "Payslip print"],
    downloadUrl: "/products/payroll.xlsx",
    active: true,
  },
  {
    id: "data-audit-service",
    title: "Business Data Audit - Done For You",
    description: "I analyze your data and send 10 insights + dashboard.",
    price: 135,
    currency: "USD",
    category: "Service",
    features: ["Up to 20k rows", "PDF report + dashboard", "3 days delivery"],
    downloadUrl: null,
    active: true,
  },
  {
    id: "vip-bundle",
    title: "TMG VIP Bundle - 10 Templates",
    description: "All templates + updates + video guide.",
    price: 55,
    currency: "USD",
    category: "Bundle",
    features: ["10 premium templates", "Free updates", "Video guide"],
    downloadUrl: "/products/vip-bundle.zip",
    bestseller: true,
    active: true,
  },
];

async function loadShopProducts() {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
    if (!base) return DEFAULT_PRODUCTS;
    const url = base.endsWith("/api") ? `${base}/settings/public` : `${base}/api/settings/public`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return DEFAULT_PRODUCTS;
    const rows = await res.json();
    const shopRow = rows.find((r: any) => r.key === "shop_products_json" || r.key === "tmg_shop_products");
    if (shopRow?.effectiveValue) {
      const parsed = typeof shopRow.effectiveValue === "string" ? JSON.parse(shopRow.effectiveValue) : shopRow.effectiveValue;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return DEFAULT_PRODUCTS;
  } catch {
    return DEFAULT_PRODUCTS;
  }
}

export default async function ShopPage() {
  const products = await loadShopProducts();
  return <ShopClient products={products} />;
}