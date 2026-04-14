/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cal-bg-base': 'var(--color-cal-bg-base)',
        'cal-bg-surface': 'var(--color-cal-bg-surface)',
        'cal-bg-card': 'var(--color-cal-bg-card)',
        'cal-bg-subtle': 'var(--color-cal-bg-subtle)',
        'cal-bg-emphasis': 'var(--color-cal-bg-emphasis)',
        'cal-bg-inverted': 'var(--color-cal-bg-inverted)',

        'cal-text-primary': 'var(--color-cal-text-primary)',
        'cal-text-default': 'var(--color-cal-text-default)',
        'cal-text-muted': 'var(--color-cal-text-muted)',
        'cal-text-dimmed': 'var(--color-cal-text-dimmed)',
        'cal-text-inverted': 'var(--color-cal-text-inverted)',

        'cal-border': 'var(--color-cal-border)',
        'cal-border-emphasis': 'var(--color-cal-border-emphasis)',

        'cal-brand': 'var(--color-cal-brand)',
        'cal-brand-text': 'var(--color-cal-brand-text)',

        'cal-success': 'var(--color-cal-success)',
        'cal-success-subtle': 'var(--color-cal-success-subtle)',
        'cal-warning-subtle': 'var(--color-cal-warning-subtle)',
        'cal-error': 'var(--color-cal-error)',
        'cal-info': 'var(--color-cal-info)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
