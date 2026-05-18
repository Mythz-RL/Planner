/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'system-ui', 'sans-serif'],
        serif: ['"Tiempos Headline"', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#37352f',
          light: '#787774',
          faint: '#9b9a97',
        },
        paper: {
          DEFAULT: '#ffffff',
          warm: '#fbfaf9',
          muted: '#f7f6f3',
          line: '#ebeae6',
        },
        accent: {
          school: '#2383e2',
          debate: '#9065b0',
          sports: '#0f7b6c',
          personal: '#d44c47',
          other: '#cb912f',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15,15,15,0.04), 0 2px 8px rgba(15,15,15,0.03)',
        lift: '0 4px 12px rgba(15,15,15,0.08), 0 8px 24px rgba(15,15,15,0.04)',
      },
      borderRadius: {
        card: '6px',
      },
    },
  },
  plugins: [],
};
