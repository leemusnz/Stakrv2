import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Montserrat", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "#FFFFFF",
        foreground: "#1A1A1A",
        primary: {
          DEFAULT: "#F46036",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#3FC1C9",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#FF3B30",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F5F5F5",
          foreground: "#1A1A1A",
        },
        accent: {
          DEFAULT: "#F5F5F5",
          foreground: "#1A1A1A",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#1A1A1A",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1A1A1A",
        },
        success: "#4CAF50",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(244, 96, 54, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(244, 96, 54, 0.6)" },
        },
        "check-bounce": {
          "0%, 20%, 50%, 80%, 100%": { transform: "translateY(0)" },
          "40%": { transform: "translateY(-3px)" },
          "60%": { transform: "translateY(-1px)" },
        },
        "success-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(76, 175, 80, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(76, 175, 80, 0.6)" },
        },
        "slide-in-from-bottom": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-from-left": {
          "0%": { transform: "translateX(-20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "progress-grow": {
          "0%": { width: "0%" },
          "100%": { width: "var(--final-width)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "check-bounce": "check-bounce 1s ease-in-out infinite",
        "success-glow": "success-glow 2s ease-in-out infinite",
        "slide-in-from-bottom-4": "slide-in-from-bottom 0.6s ease-out",
        "slide-in-from-left-4": "slide-in-from-left 0.5s ease-out",
        "progress-grow": "progress-grow 1.5s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
