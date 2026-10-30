const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = [
    {
      id: "excel1",
      title: "Financial Model Pro - 3 Statements",
      description: "Investor-ready Excel financial model with P&L, Cashflow, Balance Sheet",
      price: 49,
      currency: "USD",
      category: "Excel Template",
      type: "PRODUCT",
      features: ["50+ sheets", "Investor ready", "Qatar VAT included", "Lifetime updates"],
      downloadUrl: "https://tmg-qatar.com/templates/financial-model.xlsx",
      active: true,
      bestseller: true
    },
    {
      id: "svc1",
      title: "Qatar Company Formation - Full PRO",
      description: "Full PRO service for Qatar company setup: CR, Trade License, Chamber, MOCI",
      price: 500,
      currency: "QAR",
      category: "Service",
      type: "SERVICE",
      features: ["CR + Trade License", "Chamber registration", "MOCI approval", "7 days delivery"],
      active: true
    },
    {
      id: "bundle1",
      title: "Business Starter Bundle",
      description: "5 Excel templates + 2 Power BI dashboards",
      price: 149,
      currency: "USD",
      category: "Bundle",
      type: "PRODUCT",
      features: ["5 Excel", "2 Power BI", "Save $100", "Video tutorials"],
      downloadUrl: "https://tmg-qatar.com/bundles/starter.zip",
      active: true,
      bestseller: true
    },
    {
      id: "consult1",
      title: "Business Plan Consulting",
      description: "We write your investor business plan + financials",
      price: 2500,
      currency: "QAR",
      category: "Consulting Kit",
      type: "SERVICE",
      features: ["20-page plan", "Financial model", "Pitch deck", "2 revisions"],
      active: true
    }
  ];

  // Try different table names
  try {
    // Option 1: Setting table
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "Setting" (key TEXT PRIMARY KEY, value TEXT)`;
    await prisma.setting.upsert({
      where: { key: "shop_products_json" },
      update: { value: JSON.stringify(products) },
      create: { key: "shop_products_json", value: JSON.stringify(products) }
    });
    console.log("Saved to Setting table");
  } catch(e) {
    console.log("Setting failed, trying Content/Settings:", e.message);
    // Option 2: Try via raw query
    try {
      await prisma.$executeRawUnsafe(`INSERT INTO "Settings" (key, value) VALUES ('shop_products_json', '${JSON.stringify(products).replace(/'/g, "''")}') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`);
      console.log("Saved to Settings table");
    } catch(e2) {
      console.error(e2);
      // Option 3: Just print file for manual API
      const fs = require('fs');
      fs.writeFileSync('shop-products.json', JSON.stringify(products, null, 2));
      console.log("Saved to file shop-products.json - import via admin panel");
    }
  }
  
  await prisma.$disconnect();
}

main();
