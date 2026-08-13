/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Natur-/Pfadfinder-Palette: Waldgrün, Moos, Zeltbeige, Lagerfeuer.
        moos: {
          50: '#f2f7ee',
          100: '#e0edd6',
          200: '#c2dbaf',
          300: '#9cc37f',
          400: '#77a855',
          500: '#598b39',
          600: '#436e2b',
          700: '#345525',
          800: '#2c4421',
          900: '#263a1f',
        },
        zelt: {
          100: '#f6efe1',
          200: '#eaddc2',
          300: '#dcc79b',
        },
        lagerfeuer: {
          400: '#f59e42',
          500: '#e97b1f',
          600: '#c85f12',
        },
      },
      fontFamily: {
        sans: ['ui-rounded', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
