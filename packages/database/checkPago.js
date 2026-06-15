const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pagos = await prisma.pago.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { empresa: true }
  });
  console.log(JSON.stringify(pagos, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
