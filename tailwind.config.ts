import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["Manrope", "sans-serif"],
      },
      borderRadius: { "3xl": "1.5rem" },
      boxShadow: {
        ambient: "0 20px 40px rgba(0, 73, 219, 0.06)",
        float: "0 12px 32px rgba(0, 73, 219, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
