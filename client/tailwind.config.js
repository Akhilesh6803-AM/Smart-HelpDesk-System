/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#06060f',
          surface: '#0d0b1e',
          card: '#130e2e'
        },
        light: {
          bg: '#eef0f3',
          surface: '#f4f5f7',
          card: '#ffffff'
        },
        primary: {
          DEFAULT: '#6366f1', // indigo
          hover: '#4f46e5'
        },
        secondary: {
          DEFAULT: '#8b5cf6', // violet
          hover: '#7c3aed'
        },
        accent: {
          text: '#a78bfa', // lavender
          warm: '#f97316',
          success: '#10b981'
        }
      },
      animation: {
        blob: 'blob 10s infinite',
        'liquid-spin': 'liquid-spin 2s linear infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        'liquid-spin': {
          '0%': { transform: 'rotate(0deg)', borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' },
          '100%': { transform: 'rotate(360deg)', borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' },
        }
      }
    },
  },
  plugins: [],
}
