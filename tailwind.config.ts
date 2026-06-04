import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0a0a0b",
          900: "#101012",
          850: "#151518",
          800: "#1c1c20",
          700: "#26262c",
          600: "#34343c",
        },
        flame: {
          400: "#ff8a3d",
          500: "#ff6b1a",
          600: "#f25008",
        },
        gold: {
          400: "#ffc83d",
          500: "#f5a623",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,107,26,0.18), 0 8px 40px -12px rgba(255,107,26,0.35)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out both",
        "pop-in": "pop-in 0.18s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
