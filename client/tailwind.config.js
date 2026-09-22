/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
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
