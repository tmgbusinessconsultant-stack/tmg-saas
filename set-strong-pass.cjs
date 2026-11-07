const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('Admin@12345678', 10);
  await prisma.user.update({
    where: { email: 'admin@tmg.qa' },
    data: { passwordHash: hash }
  });
  console.log('Now password is Admin@12345678');
}
main().then(()=>process.exit(0));
