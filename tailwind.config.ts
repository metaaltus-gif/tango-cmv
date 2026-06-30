import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tango: {
          black: "#080808",
          charcoal: "#181818",
          panel: "#111111",
          yellow: "#F5C100",
          "yellow-hi": "#FFD000",
          red: "#D42B2B",
          white: "#FFFFFF",
          grey: "#2A2A2A",
          border: "#2A2A2A",
          muted: "#888888",
        },
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
        mono: ["var(--font-space-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        widest2: "0.22em",
        widest3: "0.28em",
      },
    },
  },
  plugins: [],
};
export default config;
