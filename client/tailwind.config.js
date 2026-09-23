/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    fontSize: {
      xs: ['0.8125rem', { lineHeight: '1.125rem' }],
      sm: ['0.9375rem', { lineHeight: '1.375rem' }],
      base: ['1.0625rem', { lineHeight: '1.625rem' }],
      lg: ['1.1875rem', { lineHeight: '1.875rem' }],
      xl: ['1.3125rem', { lineHeight: '1.875rem' }],
      '2xl': ['1.625rem', { lineHeight: '2.125rem' }],
      '3xl': ['2rem', { lineHeight: '2.375rem' }],
      '4xl': ['2.5rem', { lineHeight: '2.75rem' }],
      '5xl': ['3.25rem', { lineHeight: '1' }],
      '6xl': ['3.875rem', { lineHeight: '1' }],
      '7xl': ['4.75rem', { lineHeight: '1' }],
    },
    extend: {
      colors: {
        // Brand tokens — do not introduce purple, gradients, or shadows
        // per the design-direction constraints.
        background: 'rgb(var(--brand-background, 250 250 248) / <alpha-value>)',
        surface: 'rgb(var(--brand-surface, 241 241 238) / <alpha-value>)',
        ink: 'rgb(var(--brand-ink, 23 23 22) / <alpha-value>)',
        muted: 'rgb(var(--brand-muted, 104 104 100) / <alpha-value>)',
        border: 'rgb(var(--brand-border, 221 221 216) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Manrope', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        // Flat / minimally-rounded per the design direction.
        none: '0px',
        sm: '2px',
        DEFAULT: '4px',
      },
      boxShadow: {
        none: 'none',
      },
    },
  },
  plugins: [],
};
