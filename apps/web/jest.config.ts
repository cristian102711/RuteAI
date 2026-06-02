import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  // Carga los matchers de @testing-library/jest-dom después del entorno
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    // Alias @ → raíz del proyecto (compatibilidad con Next.js)
    "^@/(.*)$": "<rootDir>/$1",
    // Stub para CSS modules
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    // Stub para archivos estáticos
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.js",
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
        },
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "!app/**/*.d.ts",
    "!app/**/layout.tsx",
    "!app/**/loading.tsx",
    "!app/**/page.tsx",
  ],
};

export default config;
