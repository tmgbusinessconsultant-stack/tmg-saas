const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const settings = [
    { key: 'projectUploadLimitMb', value: JSON.stringify(100) },
    { key: 'homepage', value: JSON.stringify({ heroTitle: 'TMG Business Consulting' }) },
    { key: 'seo', value: JSON.stringify({ title: 'TMG', description: 'Business Consulting Qatar' }) },
  ];
  for (const s of settings) {
    await prisma.cmsSetting.upsert({ where: { key: s.key }, update: { value: s.value }, create: { key: s.key, value: s.value } });
    console.log('Setting', s.key);
  }
  const pub = [
    { key: 'contactEmail', value: 'hello.tmgbusinessconsulting@gmail.com' },
    { key: 'whatsappNumber', value: '97470454450' },
    { key: 'phoneNumber', value: '97470454450' },
  ];
  for (const s of pub) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value, isPublic: true }, create: { key: s.key, value: s.value, isPublic: true } });
    console.log('Public', s.key);
  }
  console.log('✅ All settings done');
}
main().finally(()=>prisma.$disconnect());
