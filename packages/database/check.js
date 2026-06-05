const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const emp = await prisma.empresa.findFirst();
  console.log(emp);
}
main();
