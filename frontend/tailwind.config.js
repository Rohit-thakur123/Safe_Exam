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
          primary: '#0a0a0f',
          secondary: '#0f0f17',
          card: 'rgba(255,255,255,0.04)',
        },
        accent: {
          purple: '#8b5cf6',
          indigo: '#6366f1',
          cyan: '#06b6d4',
          emerald: '#10b981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      maxWidth: {
        '8xl': '96rem',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      },
      boxShadow: {
        'glow-purple': '0 0 40px rgba(139,92,246,0.15)',
        'glow-indigo': '0 0 40px rgba(99,102,241,0.15)',
        'glow-cyan': '0 0 40px rgba(6,182,212,0.15)',
        'glow-emerald': '0 0 40px rgba(16,185,129,0.15)',
      }
    },
  },
  plugins: [],
}