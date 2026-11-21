import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0b1220",
          900: "#111a2e",
          800: "#1d2942",
          700: "#33415c",
          500: "#64748b",
          400: "#94a3b8",
        },
        canvas: "#f6f8fb",
        brand: {
          50: "#eef4ff",
          100: "#dbe8ff",
          500: "#3b6fe8",
          600: "#2f5ed0",
          700: "#244aa6",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.04)",
        pop: "0 16px 50px rgba(15, 23, 42, 0.16)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
