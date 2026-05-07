import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9ecff",
          500: "#1d6dff",
          600: "#1058e0",
          700: "#0c45b3",
          900: "#082a6b",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
