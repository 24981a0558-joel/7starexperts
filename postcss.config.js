// 📘 PostCSS processes your CSS through plugins.
// Tailwind uses PostCSS under the hood to transform utility classes into real CSS.
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},   // adds browser vendor prefixes automatically (-webkit-, -moz-)
  },
};
