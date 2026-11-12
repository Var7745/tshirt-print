/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#FAF7F2',
          200: '#F3ECE1',
          300: '#E6DCC9',
          400: '#D5C4AC',
          DEFAULT: '#FAF7F2',
        },
        brand: {
          dark: '#1A1613',
          card: '#FFFFFF',
          border: '#E8E2D8',
          accent: '#D9531E',
          accentHover: '#BF4314',
          subtle: '#6B665F',
          amber: '#F59E0B',
        }
      },
      fontFamily: {
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
