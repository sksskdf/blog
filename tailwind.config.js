/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans KR', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          black: '#0a0a0a',
          dark: '#111111',
          gray: '#222222',
          green: '#00ff41',
          accent: '#39ff14',
        },
        'dark-bg': '#050505',
        'dark-card': '#0a0a0a',
        'dark-text': '#e5e5e5',
        'dark-muted': '#999',
        'dark-subtle': '#666',
        'dark-border': '#222',
        'dark-border-subtle': '#333',
        'dark-gray': '#111111',
      },
    },
  },
  plugins: [],
}

