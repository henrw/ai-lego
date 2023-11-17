/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    fontFamily: {
      'sans': ['Helvetica', 'Arial', 'sans-serif'],
    },
    extend: {
      colors: {
        'dark-gray': '#D9D9D9',
        'regular-gray': '#F2F2F2',
      }
    },
  },
  plugins: [],
}

