/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'raven': {
          'bg': '#0a0a0f',
          'card': '#12121a',
          'border': '#1e1e2e',
          'text': '#e4e4e7',
          'muted': '#71717a',
          'orange': '#f97316',
          'teal': '#14b8a6',
        }
      },
      fontFamily: {
        'mokoto': ['Mokoto', 'monospace'],
      },
    },
  },
  plugins: [],
}