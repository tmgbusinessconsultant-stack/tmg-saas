const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function fullAdminCheck() {
  console.log("========== ADMIN TABLES FULL CHECK ==========\n");

  // 1. List all tables
  const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;`;
  const tableNames = tables.map(t=>t.table_name);
  console.log("ALL TABLES:", tableNames.join(", "), "\n");

  // 2. Check UserPlan structure (critical for money control)
  console.log("=== 1. UserPlan (Money Control) ===");
  try {
    const cols = await prisma.$queryRaw`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='UserPlan' ORDER BY column_name;`;
    console.log("Columns:", cols.map(c=>`${c.column_name}(${c.data_type})`).join(", "));
    const count = await prisma.$queryRaw`SELECT COUNT(*) as cnt, status, planId, billingCycle, autoRenew, paypalSubscriptionId FROM "UserPlan" GROUP BY status, planId, billingCycle, autoRenew, paypalSubscriptionId LIMIT 5;`;
    console.log("Sample rows:", count);
  } catch(e){ console.log("ERROR UserPlan:", e.message); }

  // 3. Check User (for admin users list)
  console.log("\n=== 2. User (Admin needs email/name/role) ===");
  try {
    const cols = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name='User';`;
    console.log("User columns:", cols.map(c=>c.column_name).join(", "));
    const users = await prisma.$queryRaw`SELECT id, email, role FROM "User" LIMIT 3;`;
    console.log("Users:", users);
  } catch(e){ console.log("ERROR User:", e.message); }

  // 4. Check Payment (for revenue stats)
  console.log("\n=== 3. Payment (Revenue) ===");
  try {
    const cols = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name='Payment';`;
    console.log("Payment columns:", cols.map(c=>c.column_name).join(", "));
    const cnt = await prisma.$queryRaw`SELECT COUNT(*) FROM "Payment";`;
    console.log("Payment count:", cnt);
  } catch(e){ console.log("ERROR Payment:", e.message); }

  // 5. Check QuoteRequest (admin quotes)
  console.log("\n=== 4. QuoteRequest (Admin Quotes) ===");
  try {
    const cnt = await prisma.$queryRaw`SELECT COUNT(*) FROM "QuoteRequest";`;
    console.log("QuoteRequest count:", cnt);
  } catch(e){ console.log("ERROR QuoteRequest:", e.message); }

  // 6. Check AiUsage, Projects, etc for admin dashboard
  console.log("\n=== 5. Other Admin Tables ===");
  for (const t of ["AiUsage", "Project", "BlogPost", "Subscription", "MembershipPlan"]) {
    try {
      const cnt = await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "${t}";`);
      console.log(`${t}: ${cnt[0].count} rows`);
    } catch(e){ console.log(`${t}: MISSING or ERROR - ${e.message}`); }
  }

  // 7. Check MISSING columns in UserPlan for auto-renewal
  console.log("\n=== 6. CRITICAL CHECK - Missing Columns for Auto-Renewal ===");
  const requiredCols = ["paypalSubscriptionId", "paypalOrderId", "autoRenew", "trialEndsAt", "usageLimit", "usageCount", "allowedTools"];
  const existingCols = (await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name='UserPlan';`).map(c=>c.column_name);
  for (const col of requiredCols) {
    console.log(`${col}: ${existingCols.includes(col) ? "✅ EXISTS" : "❌ MISSING"}`);
  }

  await prisma.$disconnect();
}
fullAdminCheck();
