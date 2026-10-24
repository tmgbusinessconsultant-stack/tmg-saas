const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function checkPlans() {
  const plans = await prisma.userPlan.findMany({ include: { user: { select: { email: true, role: true } } } });
  console.log(plans.map(p=> ({ email: p.user?.email, role: p.user?.role, planId: p.planId, billing: p.billingCycle, status: p.status, autoRenew: p.autoRenew, endDate: p.endDate })));
  await prisma.$disconnect();
}
checkPlans();
