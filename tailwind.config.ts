import type { Config } from "tailwindcss"
import tailwindcssAnimate from "tailwindcss-animate"

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
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-bricolage)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-teko)", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: "hsl(var(--success))",
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
        "float-glow-1": {
          "0%, 100%": { 
            transform: "translate(0vw, 0vh) scale(1)",
            opacity: "0.10"
          },
          "25%": { 
            transform: "translate(-40vw, -30vh) scale(1.2)",
            opacity: "0.15"
          },
          "50%": { 
            transform: "translate(35vw, -20vh) scale(0.8)",
            opacity: "0.08"
          },
          "75%": { 
            transform: "translate(-25vw, 40vh) scale(1.1)",
            opacity: "0.12"
          },
        },
        "float-glow-2": {
          "0%, 100%": { 
            transform: "translate(0vw, 0vh) scale(1) rotate(0deg)",
            opacity: "0.07"
          },
          "20%": { 
            transform: "translate(45vw, 25vh) scale(1.3) rotate(25deg)",
            opacity: "0.10"
          },
          "40%": { 
            transform: "translate(-35vw, -15vh) scale(0.75) rotate(-15deg)",
            opacity: "0.05"
          },
          "60%": { 
            transform: "translate(30vw, -35vh) scale(1.15) rotate(30deg)",
            opacity: "0.09"
          },
          "80%": { 
            transform: "translate(-40vw, 20vh) scale(0.9) rotate(-10deg)",
            opacity: "0.06"
          },
        },
        "float-glow-3": {
          "0%, 100%": { 
            transform: "translate(0vw, 0vh) scale(1)",
            opacity: "0.05"
          },
          "30%": { 
            transform: "translate(-50vw, 35vh) scale(1.4)",
            opacity: "0.08"
          },
          "55%": { 
            transform: "translate(40vw, -40vh) scale(0.7)",
            opacity: "0.03"
          },
          "85%": { 
            transform: "translate(-20vw, -25vh) scale(1.2)",
            opacity: "0.07"
          },
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
        "float-glow-1": "float-glow-1 40s ease-in-out infinite",
        "float-glow-2": "float-glow-2 50s ease-in-out infinite",
        "float-glow-3": "float-glow-3 45s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
