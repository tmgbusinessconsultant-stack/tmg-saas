const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('Admin@12345678', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@tmg.qa' },
    update: { passwordHash: hash, role: 'SUPER_ADMIN', isActive: true, tokenVersion: 0 },
    create: { 
      email: 'admin@tmg.qa', 
      passwordHash: hash, 
      role: 'SUPER_ADMIN', 
      name: 'TMG Admin',
      isActive: true, 
      tokenVersion: 0
    }
  });
  console.log('SUCCESS:', user.email, user.role);
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
