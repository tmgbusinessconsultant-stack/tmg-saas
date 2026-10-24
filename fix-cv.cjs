const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main(){
  const r = await prisma.cvDocument.updateMany({
    data: { isBlocked: false, downloadMode: 'FREE', price: 0, isPaid: false }
  });
  console.log('Updated', r.count);
  const list = await prisma.cvDocument.findMany({take:3});
  console.log(list.map(c=>({id:c.id, price:c.price, downloadMode:c.downloadMode, isBlocked:c.isBlocked})));
}
main().then(()=>process.exit(0));
