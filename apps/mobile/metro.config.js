const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Prioritize .js over .mjs to avoid ESM issues on web (like import.meta)
config.resolver.sourceExts = [
  "ts",
  "tsx",
  "js",
  "jsx",
  "json",
  "cjs",
  "mjs",
  "scss",
  "sass",
  "css",
];

// Disable package exports to force Metro to use the 'main' field (CJS) instead of 'exports' (which often points to ESM/mjs)
config.resolver.unstable_enablePackageExports = false;

// Alias zustand to its CJS version to avoid import.meta issues on web
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "zustand": path.resolve(__dirname, "../../node_modules/zustand/index.js"),
  "zustand/vanilla": path.resolve(__dirname, "../../node_modules/zustand/vanilla.js"),
  "zustand/middleware": path.resolve(__dirname, "../../node_modules/zustand/middleware.js"),
  "zustand/traditional": path.resolve(__dirname, "../../node_modules/zustand/traditional.js"),
  "zustand/shallow": path.resolve(__dirname, "../../node_modules/zustand/shallow.js"),
  "zustand/middleware/immer": path.resolve(__dirname, "../../node_modules/zustand/middleware/immer.js"),
  "react": path.resolve(__dirname, "../../node_modules/react"),
  "react-dom": path.resolve(__dirname, "../../node_modules/react-dom"),
};



module.exports = withNativeWind(config, { input: "./src/global.css" });

