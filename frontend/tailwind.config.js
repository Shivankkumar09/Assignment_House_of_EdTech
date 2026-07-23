/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#14151a",
          900: "#1b1c22",
          800: "#25262e",
          700: "#33343e",
          600: "#494b58",
          500: "#65697a",
          400: "#8a8fa3",
          300: "#b3b7c6",
          200: "#dcdee6",
          100: "#eef0f4",
          50: "#f7f8fa",
        },
        signal: {
          DEFAULT: "#3a5bff",
          soft: "#e8ecff",
          dark: "#2338b0",
        },
        amber: {
          DEFAULT: "#e2a63b",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,21,26,0.06), 0 8px 24px -12px rgba(20,21,26,0.18)",
      },
    },
  },
  plugins: [],
};
