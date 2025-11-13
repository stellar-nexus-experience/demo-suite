// Mini Games Constants and Configuration

// Game status types
export type GameStatus = 'available' | 'beta' | 'development' | 'coming-soon';
export type GameDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

// Promotional Banner Configuration
export interface PromotionalBanner {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  gradient: string;
  cta: string;
  badge?: string;
  players?: string;
}

// Game Category Configuration
export interface GameCategory {
  id: string;
  name: string;
  count: number;
}

// Mini Game Configuration
export interface MiniGame {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  icon: string;
  status: GameStatus;
  category: string;
  difficulty: GameDifficulty;
  estimatedTime: string;
  rewards: string;
  currentPlayers?: number;
  rating: number;
  thumbnail: string;
  progress: number;
  estimatedRelease: string;
  donationGoal: number;
  currentDonations: number;
  features: string[];
  achievements: string[];
}

// Epic promotional banners
export const PROMOTIONAL_BANNERS: PromotionalBanner[] = [
  {
    id: 1,
    title: 'WEB3 LEARNING REVOLUTION',
    subtitle: 'Learn blockchain while earning rewards',
    description: 'Master smart contracts, earn crypto, and build the future',
    image: '/images/banner/web3-learning.png',
    gradient: 'from-purple-600 via-pink-600 to-orange-600',
    cta: 'Start Learning Now',
  },
  {
    id: 2,
    title: 'DAILY CONTESTS & PRIZES',
    subtitle: 'Compete with developers worldwide',
    description: 'Win XLM, NFTs, and exclusive web3 opportunities',
    image: '/images/banner/daily-contest.png',
    gradient: 'from-blue-600 via-cyan-600 to-teal-600',
    cta: 'Join Contest',
  },
  {
    id: 3,
    title: 'SECRET MISSIONS UNLOCKED',
    subtitle: 'Hidden challenges await',
    description: 'Discover secret quests and earn legendary rewards',
    image: '/images/banner/secret-missions.png',
    gradient: 'from-green-600 via-emerald-600 to-teal-600',
    cta: 'Explore Missions',
  },
  {
    id: 4,
    title: 'FEATURED GAME OF THE WEEK',
    subtitle: 'NEXUS Web3 Infinite Runner',
    description: 'Master blockchain fundamentals through interactive gameplay!',
    image: '/videos/infinite-runner.mp4',
    gradient: 'from-yellow-500 via-orange-500 to-red-500',
    cta: 'Play Now',
  },
];

// Enhanced game categories
export const GAME_CATEGORIES: GameCategory[] = [
  { id: 'all', name: '🎮 All Games', count: 8 },
  { id: 'beta', name: '🧪 Beta', count: 2 },
  { id: 'development', name: '🚧 In Development', count: 1 },
  { id: 'coming-soon', name: '⏳ Coming Soon', count: 1 },
];

// Enhanced mini games with epic descriptions and thumbnails
export const MINI_GAMES: MiniGame[] = [
  {
    id: 'web3-basics-adventure',
    title: 'NEXUS Infinite Runner',
    description:
      'Embark on an epic journey through blockchain fundamentals. Learn smart contracts, wallets, and DeFi while earning crypto rewards!',
    shortDescription: 'Master Stellar & Web3 basics through interactive gameplay',
    icon: '🏃',
    status: 'beta', // available
    category: 'learning',
    difficulty: 'Beginner',
    estimatedTime: 'NEXUS Web3 Infinite Runner',
    rewards: '50 XLM + NFT Badge',
    rating: 4.8,
    thumbnail: '/images/games/infinite-runner.png',
    progress: 45,
    estimatedRelease: 'Beta Available',
    donationGoal: 0,
    currentDonations: 0,
    features: ['Smart Contract Basics', 'Wallet Security', 'DeFi Fundamentals', 'Interactive Quests'],
    achievements: ['First Transaction', 'Smart Contract Master', 'DeFi Explorer', 'Blockchain Pioneer'],
  },
  {
    id: 'escrow-puzzle-master',
    title: 'Escrow Puzzle Master',
    description:
      'Match escrow mechanics steps in this memory puzzle game! Learn how Trustless Work escrow contracts work by matching steps with their descriptions. Complete all pairs to master the escrow flow!',
    shortDescription: 'Learn how escrow contracts work through a memory puzzle game',
    icon: '🔐',
    status: 'beta',
    category: 'blockchain',
    difficulty: 'Intermediate',
    estimatedTime: '10-15 minutes',
    rewards: '60 XLM + Expert Badge',
    currentPlayers: 0,
    rating: 4.5,
    thumbnail: '/images/games/escrow-puzzle-master.png',
    progress: 30,
    estimatedRelease: 'Beta Available',
    donationGoal: 15000,
    currentDonations: 0,
    features: ['Escrow Systems', 'Trustless Transactions', 'Stellar Network', 'Memory Challenge'],
    achievements: ['Escrow Master', 'Trust Guardian', 'Stellar Expert', 'Memory Champion'],
  },
  {
    id: 'defi-trading-arena',
    title: 'DeFi Trading Arena',
    description:
      'Enter the competitive world of DeFi trading! Learn liquidity pools, yield farming, and automated market making while competing for top rankings.',
    shortDescription: 'Compete in DeFi trading challenges',
    icon: '📈',
    status: 'coming-soon',
    category: 'defi',
    difficulty: 'Advanced',
    estimatedTime: '6-8 hours',
    rewards: '200 XLM + Trading Trophy',
    currentPlayers: 0,
    rating: 0,
    thumbnail: '/images/games/blank.png',
    progress: 0,
    estimatedRelease: 'TBA',
    donationGoal: 15000,
    currentDonations: 0,
    features: ['Liquidity Pools', 'Yield Farming', 'AMM Strategies', 'Risk Management'],
    achievements: ['Trading Champion', 'Yield Master', 'Risk Taker', 'DeFi Legend'],
  },
  {
    id: 'nft-creation',
    title: 'NFT Creation Studio',
    description:
      'Unleash your creativity in the NFT universe! Design, mint, and trade unique digital assets while learning the art of digital ownership.',
    shortDescription: 'Create and trade unique NFTs',
    icon: '🎨',
    status: 'development',
    category: 'nft',
    difficulty: 'Intermediate',
    estimatedTime: '3-4 hours',
    rewards: '75 XLM + Creator Badge',
    currentPlayers: 0,
    rating: 0,
    thumbnail: '/images/games/blank.png',
    progress: 0,
    estimatedRelease: 'TBA',
    donationGoal: 15000,
    currentDonations: 0,
    features: ['NFT Design Tools', 'Minting Process', 'Marketplace Trading', 'Royalty Systems'],
    achievements: ['Creative Genius', 'NFT Pioneer', 'Market Master', 'Digital Artist'],
  },
];

// Game Display Configuration
export const GAME_DISPLAY_CONFIG = {
  // Promotional banner rotation settings
  PROMO_ROTATION_INTERVAL: 5000, // 5 seconds

  // Pagination settings
  INITIAL_GAMES_PER_PAGE: 4,
  LOAD_MORE_INCREMENT: 4,

  // Search and filter
  DEFAULT_CATEGORY: 'all',
  DEFAULT_SEARCH_QUERY: '',

  // Animations and transitions
  HOVER_TRANSITION_DURATION: 300,
  PROMO_TRANSITION_DURATION: 1000,
} as const;

// Color mappings for game difficulty and progress
export const GAME_COLORS = {
  difficulty: {
    Beginner: 'from-green-500 to-emerald-500',
    Intermediate: 'from-blue-500 to-cyan-500',
    Advanced: 'from-purple-500 to-pink-500',
    Expert: 'from-red-500 to-orange-500',
    default: 'from-gray-500 to-slate-500',
  },
  progress: {
    high: 'from-green-500 to-emerald-500', // >= 80
    medium: 'from-yellow-500 to-orange-500', // >= 60
    low: 'from-orange-500 to-red-500', // >= 40
    veryLow: 'from-red-500 to-pink-500', // < 40
  },
  status: {
    available: 'bg-green-500/80',
    beta: 'bg-blue-500/80',
    development: 'bg-yellow-500/80',
    'coming-soon': 'bg-gray-500/80',
    default: 'bg-gray-500/80',
  },
} as const;

// Social links for donation modal
export const DONATION_SOCIAL_LINKS = {
  TELEGRAM: 'https://t.me/josegomezdev',
  DISCORD: 'https://discord.gg/y8jADgKK',
} as const;

// Helper functions for game utilities
export const getProgressColor = (progress: number): string => {
  if (progress >= 80) return GAME_COLORS.progress.high;
  if (progress >= 60) return GAME_COLORS.progress.medium;
  if (progress >= 40) return GAME_COLORS.progress.low;
  return GAME_COLORS.progress.veryLow;
};

export const getDifficultyColor = (difficulty: GameDifficulty): string => {
  return GAME_COLORS.difficulty[difficulty] || GAME_COLORS.difficulty.default;
};

export const getStatusColor = (status: GameStatus): string => {
  return GAME_COLORS.status[status] || GAME_COLORS.status.default;
};

