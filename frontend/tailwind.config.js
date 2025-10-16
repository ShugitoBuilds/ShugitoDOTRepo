/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0b3d2e',
          DEFAULT: '#0f766e',
          light: '#5eead4'
        }
      }
    }
  },
  plugins: []
};
