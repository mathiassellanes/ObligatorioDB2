import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      fontWeight: {
        '600': '600',
        '700': '700',
        '800': '800',
        '900': '900',
      },
      colors: {
        pitch: '#39ff14',
        amber: '#ffb800',
        navy: {
          950: '#030712',
          900: '#050914',
          800: '#090f20',
          700: '#0d1529',
          600: '#111d35',
        },
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'fade-up': 'fadeUp 0.5s ease forwards',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px #39ff1440' },
          '50%': { boxShadow: '0 0 30px #39ff1480, 0 0 60px #39ff1420' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
