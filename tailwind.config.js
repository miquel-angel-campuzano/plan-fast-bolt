/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6BBBAE',
          light: '#8DD5C8',
        },
        neutral: {
          100: '#FFFFFF',
          200: '#F7F7F7',
          500: '#333333',
          700: '#1A1A1A',
        },
        accent: '#FF6D3A',
      },
    },
  },
  plugins: [],
};