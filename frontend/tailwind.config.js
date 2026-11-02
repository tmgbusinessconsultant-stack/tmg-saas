/** @type {import('tailwindcss').Config} */
const path = require("node:path");

module.exports = {
  content: [path.join(__dirname, "src/**/*.{js,ts,jsx,tsx,mdx}")],
  theme: { extend: {} },
  plugins: [],
};
