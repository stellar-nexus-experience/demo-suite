// Centralized badge assets - SVG icons, colors, and sounds
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type BadgeCategory = 'demo' | 'milestone' | 'achievement' | 'special';

export interface BadgeAsset {
  id: string;
  name: string;
  description: string;
  rarity: BadgeRarity;
  category: BadgeCategory;
  earningPoints: number;
  colors: {
    primary: string;
    secondary: string;
    gradient: string;
    text: string;
    glow: string;
  };
}

// Badge color schemes
export const BADGE_COLORS = {
  common: {
    primary: '#6b7280',
    secondary: '#9ca3af',
    gradient: 'from-gray-400 to-gray-600',
    text: 'text-gray-400',
    glow: 'shadow-gray-400/20',
  },
  rare: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
    gradient: 'from-blue-400 to-blue-600',
    text: 'text-blue-400',
    glow: 'shadow-blue-400/20',
  },
  epic: {
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    gradient: 'from-purple-400 to-purple-600',
    text: 'text-purple-400',
    glow: 'shadow-purple-400/20',
  },
  legendary: {
    primary: '#f59e0b',
    secondary: '#fbbf24',
    gradient: 'from-yellow-400 to-orange-500',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-400/20',
  },
} as const;

// Badge SVG Icons
export const BADGE_SVG_ICONS = {
  welcome_explorer: (id: string, size: string = 'w-8 h-8') => (
    <svg viewBox='0 0 64 64' className={size}>
      <defs>
        <radialGradient id={`g-welcome-${id}`} cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stopColor='#fbbf24' />
          <stop offset='100%' stopColor='#f59e0b' />
        </radialGradient>
      </defs>
      <path
        d='M32 8l8 20 20 8-20 8-8 20-8-20-20-8 20-8 8-20z'
        fill={`url(#g-welcome-${id})`}
        opacity='0.9'
      />
      <circle cx='32' cy='32' r='8' fill='#fff' opacity='0.9' />
    </svg>
  ),

  escrow_expert: (id: string, size: string = 'w-8 h-8') => (
    <svg viewBox='0 0 64 64' className={size}>
      <defs>
        <linearGradient id={`g-escrow-${id}`} x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stopColor='#67e8f9' />
          <stop offset='100%' stopColor='#3b82f6' />
        </linearGradient>
      </defs>
      <circle cx='32' cy='32' r='26' fill={`url(#g-escrow-${id})`} opacity='0.9' />
      <path d='M18 28h28v8H18z' fill='#0ea5e9' opacity='0.8' />
      <path d='M22 22h20v6H22zM22 36h20v6H22z' fill='#fff' opacity='0.9' />
    </svg>
  ),

  trust_guardian: (id: string, size: string = 'w-8 h-8') => (
    <svg viewBox='0 0 64 64' className={size}>
      <defs>
        <linearGradient id={`g-trust-${id}`} x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stopColor='#00E5FF' />
          <stop offset='100%' stopColor='#06b6d4' />
        </linearGradient>
      </defs>
      <path
        d='M32 4l20 8v14c0 14-9.2 26.7-20 34-10.8-7.3-20-20-20-34V12l20-8z'
        fill={`url(#g-trust-${id})`}
        opacity='0.85'
      />
      <path
        d='M22 30l8 8 12-12'
        fill='none'
        stroke='#fff'
        strokeWidth='4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  ),

  stellar_champion: (id: string, size: string = 'w-8 h-8') => (
    <svg viewBox='0 0 64 64' className={size}>
      <defs>
        <radialGradient id={`g-stellar-${id}`} cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stopColor='#fff7ed' />
          <stop offset='55%' stopColor='#fbbf24' />
          <stop offset='100%' stopColor='#fb7185' />
        </radialGradient>
      </defs>
      <path d='M12 52l20-40 20 40H12z' fill={`url(#g-stellar-${id})`} opacity='0.95' />
      <circle cx='32' cy='28' r='8' fill='#fff' opacity='0.95' />
      <path d='M32 18v20M22 28h20' stroke='#f59e0b' strokeWidth='3' />
    </svg>
  ),

  nexus_master: (id: string, size: string = 'w-8 h-8') => (
    <svg viewBox='0 0 64 64' className={size}>
      <defs>
        <linearGradient id={`g-nexus-${id}`} x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stopColor='#10b981' />
          <stop offset='100%' stopColor='#059669' />
        </linearGradient>
      </defs>
      <circle cx='32' cy='32' r='28' fill={`url(#g-nexus-${id})`} opacity='0.9' />
      <circle cx='32' cy='32' r='20' fill='#ffffff' opacity='0.1' />
      <path d='M32 8l6 18 18 6-18 6-6 18-6-18-18-6 18-6 6-18z' fill='#ffffff' opacity='0.9' />
      <circle cx='32' cy='32' r='4' fill='#ffffff' opacity='0.8' />
    </svg>
  ),
} as const;

// Badge sound effect
export const BADGE_SOUND = '/sounds/intro.mp3';

// Centralized badge definitions with assets
export const BADGE_ASSETS: Record<string, BadgeAsset> = {
  welcome_explorer: {
    id: 'welcome_explorer',
    name: 'Welcome Explorer',
    description: 'Joined the Nexus Experience community',
    rarity: 'common',
    category: 'achievement',
    earningPoints: 10,
    colors: BADGE_COLORS.common,
  },
  escrow_expert: {
    id: 'escrow_expert',
    name: 'Escrow Expert',
    description: 'Mastered the basic escrow flow',
    rarity: 'rare',
    category: 'demo',
    earningPoints: 30,
    colors: BADGE_COLORS.rare,
  },
  trust_guardian: {
    id: 'trust_guardian',
    name: 'Trust Guardian',
    description: 'Resolved conflicts like a true arbitrator',
    rarity: 'epic',
    category: 'demo',
    earningPoints: 50,
    colors: BADGE_COLORS.epic,
  },
  stellar_champion: {
    id: 'stellar_champion',
    name: 'Stellar Champion',
    description: 'Mastered the micro-task marketplace',
    rarity: 'epic',
    category: 'demo',
    earningPoints: 100,
    colors: BADGE_COLORS.epic,
  },
  nexus_master: {
    id: 'nexus_master',
    name: 'Nexus Master',
    description: 'Master of all trustless work demos',
    rarity: 'legendary',
    category: 'special',
    earningPoints: 200,
    colors: BADGE_COLORS.legendary,
  },
} as const;

// Helper functions
export const getBadgeAsset = (badgeId: string): BadgeAsset | null => {
  return BADGE_ASSETS[badgeId] || null;
};

export const getBadgeIcon = (badgeId: string, size: string = 'w-8 h-8'): JSX.Element | null => {
  const iconComponent = BADGE_SVG_ICONS[badgeId as keyof typeof BADGE_SVG_ICONS];
  return iconComponent ? iconComponent(badgeId, size) : null;
};

export const getBadgeColors = (badgeId: string) => {
  const asset = getBadgeAsset(badgeId);
  return asset ? asset.colors : BADGE_COLORS.common;
};

export const playBadgeSound = (): void => {
  try {
    const audio = new Audio(BADGE_SOUND);
    audio.volume = 0.3; // Keep volume moderate
    audio.play().catch(() => {
      // Silently fail if audio can't play (user hasn't interacted with page yet)
    });
  } catch (error) {
    // Badge sound error
  }
};

// Size mappings for different contexts
export const BADGE_SIZES = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-20 h-20',
  '3xl': 'w-32 h-32',
} as const;
