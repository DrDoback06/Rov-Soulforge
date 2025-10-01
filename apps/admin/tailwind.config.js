/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4488ff',
        secondary: '#ffd700',
        dark: '#0f0f1e',
        darker: '#1a1a2e',
        accent: '#2a2a3e'
      }
    },
  },
  plugins: [],
};