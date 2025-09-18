/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f5f7ff',
          100: '#eceeff',
          200: '#d7dbff',
          300: '#bfc6ff',
          400: '#97a0ff',
          500: '#6b7aff', // default-ish primary
          600: '#5563f0',
          700: '#3f4bd6',
          800: '#313aa8',
          900: '#20266f'
        }
      }
    },
  },
  plugins: [],
}
