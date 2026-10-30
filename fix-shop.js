const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Setting titles...');

  await prisma.setting.upsert({
    where: { key: 'shop_title' },
    update: { value: 'TMG Digital Store' },
    create: { key: 'shop_title', value: 'TMG Digital Store' }
  });

  await prisma.setting.upsert({
    where: { key: 'shop_subtitle' },
    update: { value: 'Tools, Templates, Designs & Resources - Instant Download' },
    create: { key: 'shop_subtitle', value: 'Tools, Templates, Designs & Resources - Instant Download' }
  });

  const shop = await prisma.setting.findUnique({ where: { key: 'shop_products_json' } });
  if (shop) {
    let arr = JSON.parse(shop.value);
    console.log('Before:', arr.length);
    arr = arr.filter(p => {
      const t = (p.type || '').toUpperCase();
      const c = (p.category || '').toLowerCase();
      if (t === 'SERVICE') return false;
      if (c.includes('service')) return false;
      if (c.includes('consulting')) return false;
      return true;
    });
    console.log('After:', arr.length);
    await prisma.setting.update({
      where: { key: 'shop_products_json' },
      data: { value: JSON.stringify(arr) }
    });
  }
  console.log('Done');
}

main().then(()=>process.exit(0)).catch(e=>{console.error(e); process.exit(1)});
