/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#D4AF37',
        'gold-light': '#f0d060',
        'gold-dark': '#b8851a',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

