/**
 * Design System Tokens
 * Central source of truth — exported as JS constants.
 * Use these in Framer Motion variants, inline styles, or dynamic logic.
 */

// ─── Colors ─────────────────────────────────────────────────────────────
export const colors = {
  accent: {
    DEFAULT: '#B45309',
    hover:   '#92400E',
    subtle:  '#FEF3C7',
    muted:   '#FDE68A',
    bright:  '#D97706',
    fg:      '#FFFFFF',
  },
  stone: {
    50:  '#FAFAF9',
    100: '#F5F5F4',
    200: '#E7E5E4',
    300: '#D6D3D1',
    400: '#A8A29E',
    500: '#78716C',
    600: '#57534E',
    700: '#44403C',
    800: '#292524',
    900: '#1C1917',
  },
  success: { DEFAULT: '#15803D', subtle: '#DCFCE7', fg: '#14532D' },
  warning: { DEFAULT: '#D97706', subtle: '#FEF3C7', fg: '#78350F' },
  error:   { DEFAULT: '#DC2626', subtle: '#FEF2F2', fg: '#7F1D1D' },
  info:    { DEFAULT: '#2563EB', subtle: '#EFF6FF', fg: '#1E3A5F' },
};

// ─── Spacing (8px base grid) ─────────────────────────────────────────────
export const spacing = {
  0:    0,
  0.5:  4,
  1:    8,
  1.5:  12,
  2:    16,
  2.5:  20,
  3:    24,
  4:    32,
  5:    40,
  6:    48,
  8:    64,
  10:   80,
  12:   96,
  16:   128,
};

// ─── Typography ──────────────────────────────────────────────────────────
export const typography = {
  fontFamily: {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  scale: {
    display: { size: '2.25rem', weight: 700, lineHeight: 1.1,  letterSpacing: '-0.02em' },
    h1:      { size: '1.75rem', weight: 600, lineHeight: 1.2,  letterSpacing: '-0.02em' },
    h2:      { size: '1.375rem',weight: 600, lineHeight: 1.3,  letterSpacing: '-0.015em' },
    h3:      { size: '1.125rem',weight: 600, lineHeight: 1.4,  letterSpacing: '-0.01em' },
    h4:      { size: '0.9375rem',weight:600, lineHeight: 1.4,  letterSpacing: '-0.005em' },
    bodyLg:  { size: '1rem',    weight: 400, lineHeight: 1.6 },
    body:    { size: '0.875rem',weight: 400, lineHeight: 1.5 },
    bodySm:  { size: '0.8125rem',weight:400, lineHeight: 1.5 },
    caption: { size: '0.75rem', weight: 400, lineHeight: 1.4 },
    label:   { size: '0.75rem', weight: 500, lineHeight: 1.3,  letterSpacing: '0.02em' },
    code:    { size: '0.8125rem',weight:400, lineHeight: 1.5 },
  },
};

// ─── Border Radius ───────────────────────────────────────────────────────
export const radius = {
  xs:   4,
  sm:   6,
  md:   8,
  lg:   12,
  xl:   16,
  full: 9999,
};

// ─── Shadows ─────────────────────────────────────────────────────────────
export const shadows = {
  xs:   '0 1px 2px 0 rgb(0 0 0 / 0.04)',
  sm:   '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
  md:   '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.04)',
  lg:   '0 8px 24px -4px rgb(0 0 0 / 0.08), 0 4px 8px -4px rgb(0 0 0 / 0.04)',
  xl:   '0 16px 48px -8px rgb(0 0 0 / 0.10), 0 8px 16px -8px rgb(0 0 0 / 0.04)',
  accent: '0 0 0 3px rgb(180 83 9 / 0.15)',
};

// ─── Motion Variants (Framer Motion) ────────────────────────────────────
export const motion = {
  // Duration guidelines (ms)
  duration: {
    micro:     0.10,
    fast:      0.15,
    standard:  0.20,
    gentle:    0.30,
    deliberate:0.40,
  },

  // Spring presets
  spring: {
    snappy:  { type: 'spring', stiffness: 400, damping: 30 },
    gentle:  { type: 'spring', stiffness: 300, damping: 30 },
    bouncy:  { type: 'spring', stiffness: 200, damping: 20 },
    stiff:   { type: 'spring', stiffness: 500, damping: 40 },
  },

  // Reusable variants
  variants: {
    fadeIn: {
      hidden:  { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
    },
    fadeUp: {
      hidden:  { opacity: 0, y: 8 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] } },
    },
    scaleIn: {
      hidden:  { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] } },
    },
    slideRight: {
      hidden:  { opacity: 0, x: -16 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] } },
    },
    slideLeft: {
      hidden:  { opacity: 0, x: 16 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] } },
    },
    staggerContainer: {
      hidden:  {},
      visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
    },
    staggerItem: {
      hidden:  { opacity: 0, y: 8 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 1, 0.5, 1] } },
    },
    // Dialog / overlay
    dialogOverlay: {
      hidden:  { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.15, ease: 'easeOut' } },
      exit:    { opacity: 0, transition: { duration: 0.1, ease: 'easeIn' } },
    },
    dialogContent: {
      hidden:  { opacity: 0, scale: 0.96, y: 8 },
      visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 32 } },
      exit:    { opacity: 0, scale: 0.96, y: 4, transition: { duration: 0.15, ease: 'easeIn' } },
    },
    // Toast
    toast: {
      hidden:  { opacity: 0, x: 48, scale: 0.96 },
      visible: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 350, damping: 28 } },
      exit:    { opacity: 0, x: 48, scale: 0.96, transition: { duration: 0.15, ease: 'easeIn' } },
    },
    // Sheet / Drawer
    sheet: {
      hidden:  { opacity: 0, x: '100%' },
      visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 32 } },
      exit:    { opacity: 0, x: '100%', transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
    },
    // Card hover
    cardHover: {
      rest:  { y: 0, boxShadow: shadows.sm },
      hover: { y: -2, boxShadow: shadows.md, transition: { duration: 0.2, ease: 'easeOut' } },
    },
  },
};

export default { colors, spacing, typography, radius, shadows, motion };
