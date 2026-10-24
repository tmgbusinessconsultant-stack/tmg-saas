const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main(){
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users`);
  for(const u of users){
    const exists = await prisma.userPlan.findFirst({where:{userId:u.id}});
    if(exists){ console.log(`Skip ${u.email}`); continue; }
    await prisma.userPlan.create({
      data:{
        userId: u.id,
        planId: u.role==='SUPER_ADMIN' ? 'BUSINESS' : 'TRIAL',
        billingCycle: 'monthly',
        status: 'ACTIVE',
        allowedTools: ['all'],
        startDate: new Date(),
        endDate: new Date(Date.now()+30*86400000),
        autoRenew: true
      }
    });
    console.log(`✅ Created BUSINESS/TRIAL for ${u.email}`);
  }
}
main().then(()=>process.exit(0));
