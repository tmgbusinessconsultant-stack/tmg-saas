const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function ensureAdminPlan() {
  const admin = await prisma.user.findFirst({ where: { email: 'admin@tmg.qa' } });
  const existing = await prisma.userPlan.findFirst({ where: { userId: admin.id } });
  if (!existing) {
    await prisma.userPlan.create({
      data: {
        userId: admin.id,
        planId: 'business',
        billingCycle: 'monthly',
        status: 'ACTIVE',
        allowedTools: ['cv-builder','cover-letter','business-plan','document-review','policy-generator','sop-builder','business-contracts','proposal-packs','business-assistant'],
        usageLimit: 1000,
        usageCount: 0,
        startDate: new Date(),
        endDate: new Date(Date.now()+30*24*60*60*1000),
        autoRenew: true
      }
    });
    console.log("✅ Created business plan for admin@tmg.qa");
  } else {
    console.log("Admin already has plan:", existing.planId);
  }
  await prisma.$disconnect();
}
ensureAdminPlan();
