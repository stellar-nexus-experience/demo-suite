// Firebase Firestore data models and types

// Transaction record for user history
export interface TransactionRecord {
  id: string; // Transaction hash or unique ID
  hash: string;
  status: 'pending' | 'success' | 'failed';
  message: string;
  timestamp: Date;
  type:
  | 'escrow'
  | 'milestone'
  | 'fund'
  | 'approve'
  | 'release'
  | 'dispute'
  | 'demo_completion'
  | 'badge_earned';
  demoId?: string;
  amount?: string;
  asset?: string;
  explorerUrl?: string;
  stellarExpertUrl?: string;
  points?: number; // Points earned from this transaction
  badgeId?: string; // If this transaction earned a badge
  walletAddress: string; // Reference to the account that owns this transaction
}

// Account - Single collection for all user data
export interface Account {
  id: string; // Wallet address as ID
  displayName: string;
  walletAddress: string;
  network: string; // 'testnet' | 'mainnet'
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;

  // Progress tracking
  level: number;
  experience: number; // XP points
  totalPoints: number; // Accumulated points from badges
  demosCompleted: string[]; // Array of demo IDs completed
  badgesEarned: string[]; // Array of badge IDs earned
  clappedDemos: string[]; // Array of demo IDs that the user has clapped for

  // Quest system
  completedQuests: string[]; // Array of quest IDs completed
  questProgress: Record<string, number>; // Progress tracking for multi-step quests

  // Profile (nested object for additional user data)
  profile?: {
    level?: number;
    totalPoints?: number;
    experience?: number;
    displayName?: string;
    username?: string;
  };

  // Referral system
  referralCode?: string;
  referredBy?: string;
  referredAt?: Date;

  // Stats (nested object for tracking statistics)
  stats?: {
    totalPoints?: number;
    lastActiveDate?: string; // Format: "YYYY-MM-DD"
    totalDemosCompleted?: number;
    totalPointsEarned?: number;
    totalTimeSpent?: number;
    streakDays?: number;
    referralsCount?: number;
    totalReferralPoints?: number;
  };

  // Transaction history - now stored in separate collection
}

// Demo statistics for tracking completion and engagement
export interface DemoStats {
  id: string; // demoId
  demoId: string;
  demoName: string;
  totalCompletions: number;
  totalClaps: number;
  totalRatings: number;
  averageRating: number;
  averageCompletionTime: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

// Game high score tracking
export interface GameScore {
  id: string; // Auto-generated document ID
  gameId: string; // Game identifier (e.g., 'web3-basics-adventure', 'infinite-runner')
  userId: string; // Wallet address
  username: string; // Display name
  score: number; // Score achieved
  level: number; // Level reached (if applicable)
  timestamp: Date; // When the score was achieved
  metadata?: {
    // Optional game-specific data
    distance?: number; // For runner games
    coinsCollected?: number;
    timeAlive?: number;
    [key: string]: any;
  };
}

// Collection names
export const COLLECTIONS = {
  ACCOUNTS: 'accounts',
  TRANSACTIONS: 'transactions',
  DEMO_STATS: 'demo_stats',
  QUESTS: 'quests',
  MANDATORY_FEEDBACK: 'mandatory_feedback',
  GAME_SCORES: 'game_scores',
} as const;

// Predefined demos configuration (static data)
export const PREDEFINED_DEMOS = [
  {
    id: 'hello-milestone',
    name: 'Baby Steps to Riches',
    subtitle: 'Learn the basics of milestone-based escrow',
    description:
      'Master the fundamental escrow flow with milestone payments. Perfect for beginners to understand how trustless transactions work.',
  },
  {
    id: 'dispute-resolution',
    name: 'Drama Queen Escrow',
    subtitle: 'Navigate complex dispute scenarios',
    description:
      'Experience real-world dispute resolution scenarios. Learn how to handle conflicts and make fair decisions in escrow disputes.',
  },
  {
    id: 'micro-marketplace',
    name: 'Gig Economy Madness',
    subtitle: 'Build a micro-task marketplace',
    description:
      'Create and manage a micro-task marketplace. Learn about task creation, worker assignment, and payment distribution.',
  },
];

// Demo feedback interface
export interface DemoFeedback {
  rating: number; // 1-5 stars
  feedback: string; // Text feedback
  difficulty: 'easy' | 'medium' | 'hard'; // Difficulty level
  wouldRecommend: boolean; // Would recommend to others
  mostHelpfulFeature: string; // Most helpful feature
  suggestions: string; // Suggestions for improvement
  demoId: string; // Associated demo ID
  demoName: string; // Demo name for context
  completionTime?: number; // Time taken in minutes
}

// Mandatory feedback tracking interface for separate collection
export interface MandatoryFeedback {
  id: string; // Auto-generated document ID
  userId: string; // Wallet address of the user
  demoId: string; // Associated demo ID
  demoName: string; // Demo name for context
  rating: number; // 1-5 stars (mandatory)
  feedback: string; // Text feedback (mandatory)
  difficulty: 'easy' | 'medium' | 'hard'; // Difficulty level
  wouldRecommend: boolean; // Would recommend to others
  completionTime: number; // Time taken in minutes
  timestamp: Date; // When feedback was submitted
  sessionId?: string; // Optional session tracking
  userAgent?: string; // Browser/client info
  ipAddress?: string; // For analytics (if needed)
}

// Quest system interfaces
export interface Quest {
  id: string;
  title: string;
  description: string;
  category: 'social' | 'referral' | 'engagement' | 'community';
  type: 'follow' | 'post' | 'join' | 'refer' | 'complete';
  requirements: {
    action: string; // What the user needs to do
    target?: string; // Target (e.g., account to follow, hashtag to use)
    count?: number; // How many times (for multi-step quests)
    verification?: 'manual' | 'automatic'; // How completion is verified
  };
  rewards: {
    experience: number;
    points: number;
    badgeId?: string; // Badge earned for completion
  };
  isActive: boolean;
  isRepeatable: boolean;
  unlockRequirements?: string[]; // Badge IDs required to unlock this quest
}

// Predefined badges configuration (static data)
export const PREDEFINED_BADGES = [
  // Demo Badges (Main Badges)
  {
    id: 'welcome_explorer',
    name: 'Welcome Explorer',
    description: 'Joined the Nexus Experience community',
    earningPoints: 10,
    baseColor: '#10B981',
    icon: 'explorer',
    category: 'achievement',
    rarity: 'common',
  },
  {
    id: 'escrow_expert',
    name: 'Escrow Expert',
    description: 'Mastered the basic escrow flow',
    earningPoints: 30,
    baseColor: '#3B82F6',
    icon: 'escrow',
    category: 'demo',
    rarity: 'rare',
  },
  {
    id: 'trust_guardian',
    name: 'Trust Guardian',
    description: 'Resolved conflicts like a true arbitrator',
    earningPoints: 50,
    baseColor: '#8B5CF6',
    icon: 'guardian',
    category: 'demo',
    rarity: 'epic',
  },
  {
    id: 'stellar_champion',
    name: 'Stellar Champion',
    description: 'Mastered the micro-task marketplace',
    earningPoints: 100,
    baseColor: '#F59E0B',
    icon: 'champion',
    category: 'demo',
    rarity: 'epic',
  },
  {
    id: 'nexus_master',
    name: 'Nexus Master',
    description: 'Master of all trustless work demos',
    earningPoints: 200,
    baseColor: '#EF4444',
    icon: 'master',
    category: 'special',
    rarity: 'legendary',
  },

  // Quest Badges (Extra Badges)
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Followed Nexus on X',
    earningPoints: 25,
    baseColor: '#1DA1F2',
    icon: 'social',
    category: 'quest',
    rarity: 'common',
  },
  {
    id: 'hashtag_hero',
    name: 'Hashtag Hero',
    description: 'Posted about Nexus Experience with hashtags',
    earningPoints: 30,
    baseColor: '#E1306C',
    icon: 'hashtag',
    category: 'quest',
    rarity: 'common',
  },
  {
    id: 'discord_warrior',
    name: 'Discord Warrior',
    description: 'Joined the Nexus Discord community',
    earningPoints: 35,
    baseColor: '#5865F2',
    icon: 'discord',
    category: 'quest',
    rarity: 'common',
  },
  {
    id: 'quest_master',
    name: 'Quest Master',
    description: 'Completed all quests - Ready to build with Starter Kits',
    earningPoints: 100,
    baseColor: '#FF6B35',
    icon: 'quest',
    category: 'quest',
    rarity: 'epic',
  },
];

// Helper functions
export const getDemoById = (id: string) => {
  return PREDEFINED_DEMOS.find(demo => demo.id === id);
};

export const getBadgeById = (id: string) => {
  return PREDEFINED_BADGES.find(badge => badge.id === id);
};

export const getAllDemos = () => {
  return PREDEFINED_DEMOS;
};

export const getAllBadges = () => {
  return PREDEFINED_BADGES;
};

// Predefined quests configuration
export const PREDEFINED_QUESTS: Quest[] = [
  {
    id: 'follow_both_accounts',
    title: 'Social Butterfly',
    description:
      'Follow @n3xusEx on X to stay updated with the latest Nexus news and Web3 innovations',
    category: 'social',
    type: 'follow',
    requirements: {
      action: 'Follow @n3xusEx on X',
      target: 'https://x.com/n3xusEx',
      verification: 'manual',
    },
    rewards: {
      experience: 250,
      points: 25,
      badgeId: 'social_butterfly',
    },
    isActive: true,
    isRepeatable: false,
    unlockRequirements: ['escrow_expert', 'trust_guardian', 'stellar_champion', 'nexus_master'],
  },
  {
    id: 'post_hashtags',
    title: 'Share the Love',
    description:
      '🚀 Share your Nexus Experience journey! Post about your progress, achievements, and learnings. Use the hashtags below and download your Referral Card from the Referral Center to share your progress with friends!',
    category: 'social',
    type: 'post',
    requirements: {
      action:
        'Post about Nexus Experience with hashtags: #NexusExperience #TrustlessWork #StellarBlockchain #BuildOnStellar',
      target: '#NexusExperience #Web3Learning #TrustlessWork #StellarBlockchain #BuildOnStellar',
      verification: 'manual',
    },
    rewards: {
      experience: 250,
      points: 25,
      badgeId: 'hashtag_hero',
    },
    isActive: true,
    isRepeatable: true,
    unlockRequirements: ['escrow_expert', 'trust_guardian', 'stellar_champion', 'nexus_master'],
  },
  {
    id: 'join_discord',
    title: 'Join the Community',
    description:
      'Join the Nexus Discord server to connect with fellow builders, see the global leaderboard rankings, and stay updated with the community!',
    category: 'community',
    type: 'join',
    requirements: {
      action: 'Join the Nexus Discord server and check the Leaderboard rankings',
      target: 'https://discord.gg/fqrKA6NB',
      verification: 'manual',
    },
    rewards: {
      experience: 250,
      points: 25,
      badgeId: 'discord_warrior',
    },
    isActive: true,
    isRepeatable: false,
    unlockRequirements: ['escrow_expert', 'trust_guardian', 'stellar_champion', 'nexus_master'],
  },
  {
    id: 'claim_quest_master_badge',
    title: 'Quest Master Badge',
    description:
      "Congratulations! You've completed all quests! 🎉 Now it's time to build your own product. Visit the Starter Kits section to download templates and start creating your Web3 projects!",
    category: 'community',
    type: 'complete',
    requirements: {
      action: 'Claim the Quest Master Badge and visit Starter Kits to start building',
      verification: 'manual',
    },
    rewards: {
      experience: 500,
      points: 100,
      badgeId: 'quest_master',
    },
    isActive: true,
    isRepeatable: false,
    unlockRequirements: ['social_butterfly', 'hashtag_hero', 'discord_warrior'],
  },
];

// Helper functions for quests
export const getQuestById = (id: string) => {
  return PREDEFINED_QUESTS.find(quest => quest.id === id);
};

export const getAllQuests = () => {
  return PREDEFINED_QUESTS;
};

export const getQuestsByCategory = (category: string) => {
  return PREDEFINED_QUESTS.filter(quest => quest.category === category);
};

export const getAvailableQuests = (completedBadges: string[]) => {
  return PREDEFINED_QUESTS.filter(quest => {
    if (!quest.isActive) return false;
    if (!quest.unlockRequirements) return true;
    return quest.unlockRequirements.every(badgeId => completedBadges.includes(badgeId));
  });
};
