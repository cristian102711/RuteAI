import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    // Alias @ → raíz del proyecto (compatibilidad con Next.js)
    "^@/(.*)$": "<rootDir>/$1",
    // Stub para CSS modules
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    // Stub para archivos estáticos
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.js",
    // Mock de next/navigation para tests
    "^next/navigation$": "<rootDir>/__mocks__/next-navigation.js",
    // Mock de next/link para tests
    "^next/link$": "<rootDir>/__mocks__/next-link.js",
    // Stub de sonner (toast) para evitar errores ESM
    "^sonner$": "<rootDir>/__mocks__/sonner.js",
    // Stub de sweetalert2
    "^sweetalert2$": "<rootDir>/__mocks__/sweetalert2.js",
  },
  testMatch: [
    "<rootDir>/__tests__/**/*.{ts,tsx}",
    "<rootDir>/**/*.test.{ts,tsx}",
  ],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
        },
      },
    ],
    // Transformar paquetes ESM (lucide-react, etc.)
    "^.+\\.(js|jsx|mjs)$": ["babel-jest", {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" }, modules: "commonjs" }],
        ["@babel/preset-react", { runtime: "automatic" }],
      ],
    }],
  },
  transformIgnorePatterns: [
    // Transformar lucide-react y otros ESM packages
    "/node_modules/(?!(lucide-react|@lucide|react-easy-crop)/)",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  collectCoverageFrom: [
    // Medir solo los archivos que tienen tests activos
    "app/dashboard/components/KPICard.tsx",
    "app/dashboard/components/StatusBadge.tsx",
    "app/dashboard/components/ScoreBadge.tsx",
    "app/dashboard/components/NotificationBell.tsx",
    "app/dashboard/components/BotonesTabla.tsx",
  ],
  coverageThreshold: {
    global: {
      statements: 60,
      branches: 50,
      functions: 60,
      lines: 60,
    },
  },
  coverageReporters: ["text", "html", "lcov"],
  coverageDirectory: "coverage",
};

export default config;
