/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    fontFamily: {
      'sans': ['ui-sans-serif', 'system-ui', ],
      'serif': ['ui-serif', 'Georgia', ],
      'mono': ['"Source Code Pro"', 'monospace'],
    },
    extend: {
      colors: {
        "dark-gray": "#D7D7D7",
        "regular-gray": "#F2F2F2",
        "cambridge-blue": "#FF5964",
        "tea-green": "#CCDDD3",
        "munsell-blue": "#CCDDD3",
        design: "#C7DE33",
        problem: "#CCDDD3",
        task: "#FDF9DB",
        data: "#E4CB8E",
        model: "#E49675",
        train: "#a7f3d0",
        test: "#7BC2DA",
        deploy: "#B3A0D9",
        feedback: "#ABC28B",
        problemDef: "#B0515B",
        modelDev: "#F0915B",
        modelEva: "#9CC2DD",
        MLOps: "#CAC38D",
        develop: "#E49675",
        "cardet-gray": "#9CAFB7",
        sage: "#ADB993",
        citron: "#D0D38F",
        "➕": "#9CAFB7",
      },
    },
  },
  plugins: [],
};
