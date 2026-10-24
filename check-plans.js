const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main(){
  const plans = await prisma.userPlan.findMany({ include:{ user:true } });
  console.log(`Total UserPlan in DB: ${plans.length}`);
  console.table(plans.map(p=>({ 
    id:p.id.slice(0,8), 
    email:p.user.email, 
    planId:p.planId, 
    status:p.status, 
    billing:p.billingCycle,
    endDate:p.endDate
  })));
}
main().finally(()=>process.exit(0));
