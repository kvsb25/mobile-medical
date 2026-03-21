/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Moved inside the config object
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
