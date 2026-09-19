import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Pila de fuentes del sistema: se ve nítida en cualquier equipo, sin depender
        // de una descarga de red (importante para el modo mostrador sin buena conexión).
        sans: [
          "ui-sans-serif",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#bad2ff",
          300: "#8ab5ff",
          400: "#5590ff",
          500: "#2f6bfa",
          600: "#1d4fed",
          700: "#173ed1",
          800: "#1933a8",
          900: "#1a2f84",
          950: "#0f1b4d",
        },
        ink: {
          50: "#f5f6f8",
          100: "#e9ebef",
          200: "#cfd3dc",
          300: "#a8afbd",
          400: "#7c8598",
          500: "#5c6577",
          600: "#454d5e",
          700: "#333a48",
          800: "#20242e",
          900: "#12141b",
          950: "#0a0b10",
        },
        success: {
          50: "#eefbf1",
          100: "#d6f5dd",
          500: "#1fa64c",
          600: "#178a3e",
          700: "#136f32",
        },
        warning: {
          50: "#fff8e8",
          100: "#ffedc2",
          500: "#e2960f",
          600: "#c17d0a",
        },
        danger: {
          50: "#fdecec",
          100: "#f9d0d0",
          500: "#d92c2c",
          600: "#b71f1f",
        },
        violet: {
          50: "#f4f0fe",
          100: "#e5daFD",
          500: "#7a3ff2",
          600: "#642fd6",
        },
        amber: {
          400: "#f2a03d",
          500: "#e6862a",
        },
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(16, 20, 30, 0.04), 0 1px 12px 0 rgba(16, 20, 30, 0.05)",
        pop: "0 8px 30px -6px rgba(16, 20, 30, 0.18)",
      },
      maxWidth: {
        prose: "68ch",
      },
      keyframes: {
        "scan-sweep": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(220%)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "loading-x": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(400%)" },
        },
      },
      animation: {
        "scan-sweep": "scan-sweep 1.6s ease-in-out infinite",
        "fade-in": "fade-in 0.25s ease-out",
        "loading-x": "loading-x 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
