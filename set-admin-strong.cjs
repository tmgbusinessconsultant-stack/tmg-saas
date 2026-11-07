const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('Admin@12345678', 10);
  await prisma.user.update({
    where: { email: 'admin@tmg.qa' },
    data: { passwordHash: hash }
  });
  console.log('Password set to Admin@12345678 - 14 chars, passes validation');
}
main().then(()=>process.exit(0));
