const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.empresa.updateMany({
    where: {
      planActivo: true
    },
    data: {
      planEstado: "activo"
    }
  });
  console.log('Update result:', result);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
