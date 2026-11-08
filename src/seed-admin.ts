import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!email || !password) { console.log('[seed-admin] SKIP - ADMIN_EMAIL / ADMIN_PASSWORD not set'); return; }
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (!existing.isActive) { await prisma.user.update({ where: { email }, data: { isActive: true } }); console.log('[seed-admin] Reactivated admin ' + email); }
      else console.log('[seed-admin] Admin already exists: ' + email);
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { email, name: 'Admin', passwordHash, role: UserRole.SUPER_ADMIN, isActive: true, permissions: [] } });
    console.log('[seed-admin] CREATED admin: ' + email);
  } catch (e) { console.log('[seed-admin] ERROR', (e as Error).message); }
  finally { await prisma.$disconnect(); }
}
