import { PrismaClient } from '@prisma/client';

// ── Singleton Pattern para evitar múltiples instancias en desarrollo (hot-reload) ──
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Re-exportar los tipos principales de Prisma en lugar de export * (evita warning de ESM)
export type {
  Empresa,
  Usuario,
  Pedido,
  Ruta,
  Ubicacion,
  Alerta,
  ReporteCache,
  LogAcceso,
  Pago,
} from '@prisma/client';

export { Prisma } from '@prisma/client';

// Default export para compatibilidad con: import prisma from "@ruteai/database"
export default prisma;
