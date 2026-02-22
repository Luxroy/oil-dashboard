/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'oil-black': '#0a0a0a',
        'oil-gray': '#1a1a1a',
        'oil-light-gray': '#2a2a2a',
        'oil-gold': '#d4af37',
        'oil-gold-light': '#f3e5ab',
        'oil-white': '#f5f5f5',
        'oil-green': '#22c55e',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
