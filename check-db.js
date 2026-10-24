const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  try {
    const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;`;
    console.log("=== DB TABLES ===");
    console.log(tables.map(t=>t.table_name).join(", "));
    
    const userPlanExists = tables.some(t=>t.table_name==='UserPlan' || t.table_name==='user_plans' || t.table_name==='UserPlans' || t.table_name.toLowerCase()==='userplan');
    console.log("\nUserPlan table exists?", userPlanExists);
    
    if (userPlanExists) {
      const count = await prisma.$queryRaw`SELECT COUNT(*) FROM "UserPlan";`;
      console.log("UserPlan rows:", count);
    }
    
    // Check columns of UserPlan if exists
    try {
      const cols = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='UserPlan';`;
      console.log("\nUserPlan columns:", cols);
    } catch(e) { console.log("Cannot read UserPlan columns:", e.message); }
    
  } catch(e) { console.error(e); }
  await prisma.$disconnect();
}
check();
