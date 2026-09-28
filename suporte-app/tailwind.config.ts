import type { Config } from "tailwindcss";

// Paleta vinda da diretriz de marca (Produtividade + Crescimento) — mantida sem alterações.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        graphite: "#12211E",
        petrol: "#0F4C42",
        emerald: "#1E9E6B",
        mint: "#D7F5E9",
        lime: "#C6F13B",
        amber: "#F2A93B",
        ice: "#F7FAF9",
        graySecondary: "#5B6B67",
        grayLight: "#E4EAE8",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
