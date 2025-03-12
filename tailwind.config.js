/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", 
    "./public/index.html",
  ],
  ignoreWarnings:[
    (warning) =>
      warning.module &&
      warning.module.resource &&
      warning.module.resource.includes('node_modules/react-datepicker'),
  ],
  theme: {
    extend: {
      animation: {
        "fade-in": "fadeIn 1s ease-in-out",
        "bounce": "bounce 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};