/**
 * Style constants for consistent UI theming
 */

// Common gradient classes
export const GRADIENTS = {
  background: {
    main: 'bg-gradient-to-br from-neutral-900 via-brand-900 to-neutral-900',
    overlay: 'bg-gradient-to-r from-brand-500/10 via-transparent to-accent-500/10',
  },
  text: {
    title: 'bg-gradient-to-r from-brand-400 via-accent-400 to-brand-400',
    subtitle: 'bg-gradient-to-r from-brand-400 to-accent-400',
  },
  button: {
    primary: 'bg-gradient-to-r from-brand-500 to-accent-500',
    primaryHover: 'hover:from-brand-600 hover:to-accent-600',
    secondary: 'bg-gradient-to-r from-brand-500/20 to-accent-500/20',
    secondaryHover: 'hover:from-brand-800/50 hover:to-accent-800/50',
    purple: 'bg-gradient-to-r from-purple-500 to-pink-500',
    purpleHover: 'hover:from-purple-600 hover:to-pink-600',
  },
} as const;

// Shadow styles
export const SHADOWS = {
  default: 'shadow-lg hover:shadow-xl',
  glow: {
    brand: 'shadow-brand-500/50',
    purple: 'shadow-purple-500/50',
    success: 'shadow-success-500/50',
    warning: 'shadow-warning-500/50',
    accent: 'shadow-accent-500/50',
  },
} as const;

// Border styles
export const BORDERS = {
  default: 'border-2 border-white/20 hover:border-white/40',
  subtle: 'border border-white/20',
} as const;

// Animation classes
export const ANIMATIONS = {
  fadeIn: 'animate-fadeIn',
  fadeInUp: 'animate-fadeInUp',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  spin: 'animate-spin',
  ping: 'animate-ping',
  twinkle: 'animate-twinkle',
} as const;

// Common transition classes
export const TRANSITIONS = {
  default: 'transition-all duration-300',
  slow: 'transition-all duration-500',
  fast: 'transition-all duration-200',
  transform: 'transition-all duration-300 transform',
  opacity: 'transition-opacity duration-300',
} as const;

// Common transform classes
export const TRANSFORMS = {
  scale: {
    sm: 'hover:scale-105',
    md: 'hover:scale-110',
    lg: 'hover:scale-125',
  },
  rotate: {
    slight: 'hover:rotate-1',
  },
} as const;

// Text sizes
export const TEXT_SIZES = {
  title: {
    sm: 'text-4xl md:text-5xl',
    md: 'text-4xl md:text-6xl',
    lg: 'text-5xl md:text-7xl lg:text-8xl',
  },
  subtitle: {
    sm: 'text-lg md:text-xl',
    md: 'text-xl md:text-2xl',
    lg: 'text-xl md:text-2xl lg:text-3xl',
  },
} as const;

// Common padding/spacing
export const SPACING = {
  section: 'py-16',
  container: 'container mx-auto px-4',
  card: 'p-6',
  button: {
    sm: 'px-6 py-3',
    md: 'px-8 py-4',
    lg: 'px-12 py-6',
  },
} as const;

// Z-index layers
export const Z_INDEX = {
  background: -1,
  default: 1,
  dropdown: 10,
  overlay: 50,
  modal: 100,
  tooltip: 1000,
  preloader: 99999,
  startScreen: 100000,
} as const;
