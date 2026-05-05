// packages/database/src/index.ts
// Prisma Client singleton — importar en apps como: import prisma from '@ruteai/database'
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => new PrismaClient()

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

export default prisma
export { prisma }
// Re-exportar todos los tipos generados por Prisma
export * from '@prisma/client'
