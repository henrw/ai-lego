/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    fontFamily: {
      sans: ["Helvetica", "Arial", "sans-serif"],
    },
    extend: {
      colors: {
        "dark-gray": "#D7D7D7",
        "regular-gray": "#F2F2F2",
        "cambridge-blue": "#FF5964",
        "tea-green": "#CCDDD3",
        "munsell-blue": "#CCDDD3",
        // design: "#CCDDD3",
        // develop: "#F2F2F2",
        problem: "#C7DE33",
        task: "#FDF9DB",
        data: "#E4CB8E",
        model: "#E49675",
        train: "#F0655B",
        test: "#7BC2DA",
        deploy: "#8C7DCA",
        feedback: "#ABC28B",
        modelDev: "#F0655B",
        modelEva: "#7BC2DA",
        MLOps: "#ABC28B",
        design: "#C7DE33",
        develop: "#E49675",
        "cardet-gray": "#9CAFB7",
        sage: "#ADB993",
        citron: "#D0D38F",
        "➕": "#D0D38F",
      },
    },
  },
  plugins: [],
};
