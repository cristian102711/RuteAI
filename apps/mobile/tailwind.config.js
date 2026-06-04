/** @type {import('tailwindcss').Config} */
const tokens = require("./src/design/tokens.json");

module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: tokens.colors.primary,
        background: tokens.colors.background || "#F9FAFB",
        surface: tokens.colors.surface,
        border: tokens.colors.border,
        text: tokens.colors.text,
        textMuted: tokens.colors.textMuted,
      },
      borderRadius: {
        xl: "16px",
        "2xl": "24px",
      }
    },
  },
  plugins: [],
}
