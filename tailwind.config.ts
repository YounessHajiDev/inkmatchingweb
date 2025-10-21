import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          bg: '#05070d',
          'bg-soft': '#090e16',
          surface: '#101623',
          'surface-alt': '#141c2d',
          muted: '#293244',
          outline: '#1d2331',
          accent: '#24d1f7',
          'accent-soft': '#57c0ff',
          'accent-strong': '#7c5cff',
          'accent-hover': '#2bb4ff',
          glow: 'rgba(36, 209, 247, 0.35)',
          text: '#d4d9e6',
          'text-muted': '#8d97ad',
        },
      },
      boxShadow: {
        glow: '0 0 35px rgba(36, 209, 247, 0.35)',
        'glow-soft': '0 10px 40px -20px rgba(36, 209, 247, 0.4)',
        'inner-glow': 'inset 0 0 0 1px rgba(255,255,255,0.05)',
      },
      borderRadius: {
        '3xl': '1.75rem',
        '4xl': '2.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'ink-radial':
          'radial-gradient(120% 120% at 50% 0%, rgba(36,209,247,0.18) 0%, rgba(124,92,255,0.12) 35%, transparent 70%), radial-gradient(140% 140% at 50% 100%, rgba(12,178,198,0.12) 0%, rgba(24,33,58,0.6) 55%, rgba(5,7,13,0.95) 100%)',
        'ink-panel':
          'radial-gradient(120% 120% at 50% 0%, rgba(36,209,247,0.12) 0%, transparent 70%)',
        'ink-button':
          'linear-gradient(120deg, #24d1f7 0%, #7c5cff 100%)',
        'ink-button-soft':
          'linear-gradient(120deg, rgba(36,209,247,0.85) 0%, rgba(124,92,255,0.85) 100%)',
      },
      fontFamily: {
        display: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      transitionProperty: {
        spacing: 'margin, padding',
      },
    },
  },
  plugins: [],
}

export default config
