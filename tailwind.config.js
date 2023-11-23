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
        'dark-gray': '#D7D7D7',
        'regular-gray': '#F2F2F2',
        'cambridge-blue': '#FF5964',
        'tea-green': '#CCDDD3',
        'munsell-blue': '#CCDDD3'
      }
    },
  },
  plugins: [],
}

