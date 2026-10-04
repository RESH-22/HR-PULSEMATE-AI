/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd3ff',
          300: '#8eb5ff',
          400: '#598cff',
          500: '#3366ff',
          600: '#1f4ae6',
          700: '#1a3bb8',
          800: '#1b3491',
          900: '#1c3073',
        },
        navy: {
          50: '#f0f3fa',
          100: '#e0e6f3',
          200: '#c3cee6',
          300: '#97aad0',
          400: '#6a82b5',
          500: '#4a6398',
          600: '#384d7a',
          700: '#2c3c61',
          800: '#1e2b45',
          900: '#131d33',
          950: '#0d1525',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      letterSpacing: {
        'tight-2': '-0.02em',
        'tight-3': '-0.03em',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)',
        'card-hover': '0 4px 6px -1px rgba(15,23,42,0.07), 0 2px 4px -2px rgba(15,23,42,0.05)',
        'card-lift': '0 12px 24px -6px rgba(15,23,42,0.10), 0 4px 8px -2px rgba(15,23,42,0.04)',
        'btn': '0 1px 2px rgba(15,23,42,0.08), 0 0 0 1px rgba(15,23,42,0.04)',
        'sidebar': '4px 0 24px -8px rgba(13,21,37,0.20)',
        'glow': '0 0 0 3px rgba(51,102,255,0.12)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
