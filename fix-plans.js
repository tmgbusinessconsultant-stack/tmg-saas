const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main(){
  console.log("Deleting all old UserPlans...");
  await prisma.userPlan.deleteMany({});

  const users = await prisma.user.findMany();
  for(const u of users){
    const isSuperAdmin = u.role === 'SUPER_ADMIN' || u.email === 'admin@tmg.qa';
    await prisma.userPlan.create({
      data:{
        userId: u.id,
        planId: isSuperAdmin ? 'BUSINESS' : 'PRO',
        billingCycle: 'monthly',
        status: 'ACTIVE',
        allowedTools: ['all'],
        startDate: new Date(),
        endDate: new Date(Date.now()+365*86400000), // 1 year
        autoRenew: true
      }
    });
    console.log(`✅ Fixed ${u.email} -> ${isSuperAdmin ? 'BUSINESS' : 'PRO'} ACTIVE`);
  }
  const count = await prisma.userPlan.count();
  console.log(`\nTotal after fix: ${count}`);
}
main().finally(()=>process.exit(0));
