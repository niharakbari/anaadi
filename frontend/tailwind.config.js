/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Brand Accent ─────────────────────────────────
        accent: {
          DEFAULT: '#B45309', // amber-700 — warm gold
          hover:   '#92400E', // amber-800
          subtle:  '#FEF3C7', // amber-100
          muted:   '#FDE68A', // amber-200
          bright:  '#D97706', // amber-600
          foreground: '#FFFFFF',
        },
        // ─── Neutrals (Stone — warm grey, never cold) ─────
        stone: {
          50:  '#FAFAF9',
          100: '#F5F5F4',
          150: '#EFEDEC',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
          950: '#0C0A09',
        },
        // ─── Semantic Colors ───────────────────────────────
        success: {
          DEFAULT: '#15803D',
          subtle:  '#DCFCE7',
          muted:   '#BBF7D0',
          foreground: '#14532D',
        },
        warning: {
          DEFAULT: '#D97706',
          subtle:  '#FEF3C7',
          muted:   '#FDE68A',
          foreground: '#78350F',
        },
        error: {
          DEFAULT: '#DC2626',
          subtle:  '#FEF2F2',
          muted:   '#FECACA',
          foreground: '#7F1D1D',
        },
        info: {
          DEFAULT: '#2563EB',
          subtle:  '#EFF6FF',
          muted:   '#BFDBFE',
          foreground: '#1E3A5F',
        },
      },

      fontFamily: {
        sans:  ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        'display': ['2.25rem', { lineHeight: '1.1',  fontWeight: '700', letterSpacing: '-0.02em' }],
        'h1':      ['1.75rem', { lineHeight: '1.2',  fontWeight: '600', letterSpacing: '-0.02em' }],
        'h2':      ['1.375rem',{ lineHeight: '1.3',  fontWeight: '600', letterSpacing: '-0.015em' }],
        'h3':      ['1.125rem',{ lineHeight: '1.4',  fontWeight: '600', letterSpacing: '-0.01em' }],
        'h4':      ['0.9375rem',{ lineHeight: '1.4', fontWeight: '600', letterSpacing: '-0.005em' }],
        'body-lg': ['1rem',    { lineHeight: '1.6',  fontWeight: '400' }],
        'body':    ['0.875rem',{ lineHeight: '1.5',  fontWeight: '400' }],
        'body-sm': ['0.8125rem',{lineHeight: '1.5',  fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.4',  fontWeight: '400' }],
        'label':   ['0.75rem', { lineHeight: '1.3',  fontWeight: '500', letterSpacing: '0.02em' }],
        'code':    ['0.8125rem',{ lineHeight: '1.5', fontWeight: '400' }],
      },

      spacing: {
        // 8px base grid
        '0.5': '4px',
        '1':   '8px',
        '1.5': '12px',
        '2':   '16px',
        '2.5': '20px',
        '3':   '24px',
        '3.5': '28px',
        '4':   '32px',
        '5':   '40px',
        '6':   '48px',
        '7':   '56px',
        '8':   '64px',
        '9':   '72px',
        '10':  '80px',
        '12':  '96px',
        '14':  '112px',
        '16':  '128px',
        '20':  '160px',
        '24':  '192px',
      },

      borderRadius: {
        'none': '0',
        'xs':   '4px',
        'sm':   '6px',
        DEFAULT:'8px',
        'md':   '8px',
        'lg':   '12px',
        'xl':   '16px',
        '2xl':  '20px',
        '3xl':  '24px',
        'full': '9999px',
      },

      boxShadow: {
        'xs':     '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'sm':     '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        DEFAULT:  '0 2px 8px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
        'md':     '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.04)',
        'lg':     '0 8px 24px -4px rgb(0 0 0 / 0.08), 0 4px 8px -4px rgb(0 0 0 / 0.04)',
        'xl':     '0 16px 48px -8px rgb(0 0 0 / 0.10), 0 8px 16px -8px rgb(0 0 0 / 0.04)',
        '2xl':    '0 24px 64px -12px rgb(0 0 0 / 0.14)',
        'inner':  'inset 0 2px 4px 0 rgb(0 0 0 / 0.04)',
        'accent': '0 0 0 3px rgb(180 83 9 / 0.15)',
        'none':   'none',
      },

      transitionDuration: {
        'micro':     '100ms',
        'fast':      '150ms',
        'standard':  '200ms',
        'gentle':    '300ms',
        'deliberate':'400ms',
      },

      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'snap':   'cubic-bezier(0.0, 0.0, 0.2, 1)',
        'ease-out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },

      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%':   { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'pulse-gentle': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
      },

      animation: {
        'fade-in':        'fade-in 200ms ease-out',
        'fade-up':        'fade-up 300ms cubic-bezier(0.25, 1, 0.5, 1)',
        'scale-in':       'scale-in 200ms cubic-bezier(0.25, 1, 0.5, 1)',
        'slide-in-right': 'slide-in-right 300ms cubic-bezier(0.25, 1, 0.5, 1)',
        'shimmer':        'shimmer 1.8s linear infinite',
        'spin-slow':      'spin-slow 1.2s linear infinite',
        'pulse-gentle':   'pulse-gentle 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
