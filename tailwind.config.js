
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          50: '#f7f8f9',
          100: '#eff0f3',
          200: '#e2e4e8',
          300: '#cdd0d6',
          400: '#9a9da6',
          500: '#74777e',
          600: '#565961',
          700: '#414349',
          800: '#2c2d35',
          900: '#1e1f26',
          950: '#12131a',
        },
        brand: {
          50: '#e8faf2',
          100: '#c6f3e0',
          200: '#93e9c8',
          300: '#4edea3',
          400: '#16c98a',
          500: '#00a572',
          600: '#008a60',
          700: '#006e4d',
          800: '#00573e',
          900: '#004733',
          950: '#002a1f',
        },
      },
      fontSize: {
        display: ['3rem', { lineHeight: '1.1', letterSpacing: '-0.04em', fontWeight: '600' }],
        'display-sm': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.035em', fontWeight: '600' }],
        'headline-lg': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.03em', fontWeight: '600' }],
        headline: ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.025em', fontWeight: '600' }],
        'headline-md': ['1.25rem', { lineHeight: '1.4', letterSpacing: '-0.015em', fontWeight: '500' }],
        'body-lg': ['1rem', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
        'body-md': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0' }],
        'label-sm': ['0.75rem', { lineHeight: '1', letterSpacing: '0.02em', fontWeight: '500' }],
        eyebrow: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.14em', fontWeight: '600' }],
      },
      borderRadius: {
        event: '0.375rem',
        control: '0.625rem',
        card: '1.5rem',
        panel: '2rem',
      },
      spacing: {
        gutter: '24px',
      },
      maxWidth: {
        container: '1200px',
      },
      boxShadow: {
        ambient: '0 1px 2px rgba(18,19,26,0.04), 0 10px 34px -12px rgba(18,19,26,0.10)',
        'ambient-lg': '0 2px 4px rgba(18,19,26,0.05), 0 28px 60px -20px rgba(18,19,26,0.16)',
        'ambient-dark': '0 1px 2px rgba(0,0,0,0.45), 0 12px 36px -12px rgba(0,0,0,0.55)',
        'ambient-dark-lg': '0 2px 6px rgba(0,0,0,0.5), 0 34px 70px -24px rgba(0,0,0,0.7)',
        mint: '0 0 0 1px rgba(0,165,114,0.18), 0 10px 30px -12px rgba(0,165,114,0.45)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '80%,100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        breathe: {
          '0%,100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 2.2s infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.24, 0, 0.38, 1) infinite',
        breathe: 'breathe 2.6s ease-in-out infinite',
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
