/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ["Space Grotesk", "system-ui", "sans-serif"],
        mono:  ["Space Mono", "monospace"],
      },
      colors: {
        /* Design token bridge */
        background: "var(--bg)",
        foreground:  "var(--text-primary)",
        card:        "var(--bg-card)",
        border:      "var(--border)",
        input:       "var(--bg-input)",
        ring:        "var(--border-focus)",

        primary:     { DEFAULT: "var(--brand)", foreground: "#08080e" },
        secondary:   { DEFAULT: "var(--bg-elevated)", foreground: "var(--text-primary)" },
        muted:       { DEFAULT: "var(--bg-elevated)", foreground: "var(--text-muted)" },
        accent:      { DEFAULT: "var(--bg-elevated)", foreground: "var(--text-primary)" },
        destructive: { DEFAULT: "var(--danger)",  foreground: "#f0eee8" },
        success:     { DEFAULT: "var(--success)", foreground: "#08080e" },

        brand:       "var(--brand)",
        violet:      "var(--violet)",
      },
      borderRadius: {
        sm:  "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        lg:  "var(--radius-lg)",
        xl:  "var(--radius-xl)",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":      { opacity: "0.4", transform: "scale(0.75)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both",
        shimmer:   "shimmer 2.5s infinite",
        "pulse-dot": "pulseDot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
