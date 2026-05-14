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
        primary: '#6366F1', // indigo
        secondary: '#8B5CF6', // violet
        background: '#0F0F1A', // dark
        surface: 'rgba(255, 255, 255, 0.05)',
        surfaceLight: '#F8F8FF', // light mode
        accent: {
          green: '#10B981', // synced
          amber: '#F59E0B', // pending
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
      }
    },
  },
  plugins: [],
}
