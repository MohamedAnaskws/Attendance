/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6fe',
          300: '#a4b9fd',
          400: '#8093f9',
          500: '#667eea',
          600: '#5a67d8',
          700: '#4c51bf',
          800: '#3c3f9e',
          900: '#2c2e7a',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease',
        'slide-in': 'slideIn 0.3s ease',
        'typing': 'typing 1.4s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        typing: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
