import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const settings = [
    { key: 'projectUploadLimitMb', value: JSON.stringify(100) },
    { key: 'homepage', value: JSON.stringify({ heroTitle: 'TMG Business Consulting', heroSubtitle: 'Qatar Business Solutions' }) },
    { key: 'seo', value: JSON.stringify({ title: 'TMG', description: 'Business Consulting Qatar' }) },
  ];
  for (const s of settings) {
    await prisma.cmsSetting.upsert({ where: { key: s.key }, update: { value: s.value }, create: { key: s.key, value: s.value } });
  }
  const publicSettings = [
    { key: 'contactEmail', value: 'hello.tmgbusinessconsulting@gmail.com', isPublic: true },
    { key: 'whatsappNumber', value: '97470454450', isPublic: true },
    { key: 'phoneNumber', value: '97470454450', isPublic: true },
  ];
  for (const s of publicSettings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value, isPublic: true }, create: { key: s.key, value: s.value, isPublic: true } });
  }
  console.log('✅ All advanced settings seeded');
}
main().finally(()=>prisma.$disconnect());
