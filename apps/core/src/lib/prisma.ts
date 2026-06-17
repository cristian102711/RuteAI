import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Logs de Prisma: en desarrollo mostramos queries; en producción sólo
// warnings y errores (visibles en los logs de Vercel → Functions).
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "production"
        ? ["warn", "error"]
        : ["query", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
