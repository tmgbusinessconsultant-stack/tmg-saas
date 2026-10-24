import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('Admin@123', 10);
  const user = await prisma.user.update({
    where: { email: 'admin@tmg.qa' },
    data: { passwordHash: hash, role: 'SUPER_ADMIN', isActive: true, tokenVersion: 0 },
  });
  console.log('Reset done:', user.email, user.role);
}
main();
