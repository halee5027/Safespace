/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        coral: '#ff6b6b',
        mint: '#22d3a6',
        amber: '#f59e0b',
        slatewash: '#e2e8f0'
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Manrope"', 'sans-serif']
      },
      boxShadow: {
        panel: '0 20px 40px rgba(15, 23, 42, 0.12)'
      },
      keyframes: {
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        riseIn: 'riseIn 500ms ease-out forwards'
      }
    }
  },
  plugins: []
};
