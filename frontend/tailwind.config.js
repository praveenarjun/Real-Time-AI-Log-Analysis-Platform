/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0f172a",
          secondary: "#020617",
        },
        accent: {
          cyan: "#06b6d4",
          fuchsia: "#d946ef",
          blue: "#3b82f6",
          emerald: "#10b981",
        },
        status: {
          info: "#0ea5e9",
          warn: "#f59e0b",
          error: "#ef4444",
          success: "#10b981",
        },
        text: {
          primary: "#f8fafc",
          secondary: "#94a3b8",
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
