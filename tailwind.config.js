/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#0B0C10',
        'brand-gray': '#1F2833',
        'brand-light': '#C5C6C7',
        'brand-accent': '#66FCF1',
        'brand-teal': '#45A29E',
        // High contrast colors
        'hc-bg': '#000000',
        'hc-text': '#FFFFFF',
        'hc-accent': '#FFFF00',
      }
    },
  },
  plugins: [],
}
