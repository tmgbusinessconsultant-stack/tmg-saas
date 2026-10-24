const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('Admin@12345678', 10);
  const user = await prisma.user.update({
    where: { email: 'admin@tmg.qa' },
    data: { passwordHash: hash, role: 'SUPER_ADMIN', isActive: true, tokenVersion: 0 },
  });
  console.log('Reset done:', user.email, 'new pass: Admin@12345678');
}
main().then(() => process.exit(0));