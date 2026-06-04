import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Necesario para que Next.js compile los packages internos del monorepo
  transpilePackages: ["@ruteai/database", "@ruteai/shared-types"],

  // Prisma Client debe ser tratado como externo en el entorno serverless de Vercel.
  // Sin esto, Next.js intenta bundlizar @prisma/client y falla en producción.
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
