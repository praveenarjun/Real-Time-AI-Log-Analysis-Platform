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
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
        },
        accent: {
          cyan: "var(--accent-cyan)",
          fuchsia: "var(--accent-fuchsia)",
          blue: "var(--accent-blue)",
          emerald: "var(--accent-emerald)",
        },
        status: {
          info: "var(--status-info)",
          warn: "var(--status-warn)",
          error: "var(--status-error)",
          success: "var(--status-success)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
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
