/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: '#0F172A',
        'basilica-blue': '#4A7CC2',
        'basilica-light': '#8FB5E9',
        'basilica-gold': '#C9A961',
      },
    },
  },
  plugins: [],
}