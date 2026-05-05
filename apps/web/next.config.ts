import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Necesario para que Next.js compile los packages internos del monorepo
  transpilePackages: ["@ruteai/database", "@ruteai/shared-types"],
};

export default nextConfig;
