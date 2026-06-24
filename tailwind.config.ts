import type { Config } from "tailwindcss";

/**
 * Tokeni su definisani kao CSS varijable u globals.css (preuzeti 1:1 sa landinga).
 * Tailwind ih samo mapira u boje/fontove. Akcenat (`accent`) je var(--role-accent),
 * koji se postavlja po ulozi na role-layout-u kroz [data-role].
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-2": "var(--bg-2)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        border: "var(--border)",
        "border-soft": "var(--border-soft)",
        text: "var(--text)",
        "text-dim": "var(--text-dim)",
        "text-faint": "var(--text-faint)",
        brass: "var(--brass)",
        "brass-soft": "var(--brass-soft)",
        mint: "var(--mint)",
        // akcenat zavisi od uloge (postavljen na [data-role])
        accent: "var(--role-accent)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "16px",
        btn: "11px",
      },
      boxShadow: {
        soft: "0 30px 60px -20px rgba(0,0,0,0.6)",
        glow: "0 4px 20px rgba(201,168,106,0.22)",
      },
    },
  },
  plugins: [],
};

export default config;
