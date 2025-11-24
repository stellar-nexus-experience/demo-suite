import { Timestamp } from 'firebase/firestore';

// Demo progress tracking
export interface DemoProgress {
  demoId: string;
  demoName: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  completedAt?: Timestamp;
  score?: number;
  attempts: number;
  lastAttemptedAt?: Timestamp;
  pointsEarned: number;
}

// NFT Badge system
export interface NFTBadge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: Timestamp;
  demoId?: string; // Which demo earned this badge
  pointsValue: number;
}

// Rewards system
export interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'points' | 'badge' | 'unlock' | 'special';
  value: number;
  unlockedAt?: Timestamp;
  demoId?: string;
}

// User account structure
export interface UserAccount {
  id: string; // UUID
  walletAddress: string;
  publicKey: string;
  network: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;

  referralCode?: string; // Hacemos opcional para cuentas antiguas.

  // Campos de Referido (Quién te refirió a TI)
  referredBy?: string; // WalletAddress del referidor.
  referredAt?: Timestamp; // Fecha en que se aplicó el código.

  // Root-level fields for backward compatibility with old Account type
  level?: number;
  experience?: number;
  totalPoints?: number;
  displayName?: string;

  // Profile information
  profile: {
    username?: string;
    displayName?: string;
    avatar?: string;
    bio?: string;
    level: number;
    totalPoints: number;
    experience: number;
  };

  // Demo progress
  demos: {
    demo1: DemoProgress;
    'hello-milestone': DemoProgress;
    demo2: DemoProgress;
    'milestone-voting': DemoProgress;
    demo3: DemoProgress;
    'dispute-resolution': DemoProgress;
    demo4: DemoProgress;
    'micro-marketplace': DemoProgress;
  };

  // Rewards and badges
  badges: NFTBadge[];
  rewards: Reward[];

  // Statistics
  stats: {
    totalDemosCompleted: number;
    totalPointsEarned: number;
    totalTimeSpent: number; // in minutes
    streakDays: number;
    lastActiveDate: string; 
    referralsCount?: number;      
  totalReferralPoints?: number;
  };

    // ========================================================
    // 👆 ESTADÍSTICAS DEL REFERIDOR AÑADIDAS AQUÍ 👆
    // ================================================

  // Settings
  settings: {
    notifications: boolean;
    publicProfile: boolean;
    shareProgress: boolean;
  };
}

// Demo configuration
export interface DemoConfig {
  id: string;
  name: string;
  description: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  pointsReward: number;
  badgesReward: NFTBadge[];
  requirements?: {
    previousDemo?: string;
    minLevel?: number;
    minPoints?: number;
  };
}

// Points transaction log
export interface PointsTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'spend' | 'bonus' | 'penalty';
  amount: number;
  reason: string;
  demoId?: string;
  timestamp: Timestamp;
  metadata?: Record<string, any>;
}

// Achievement system
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'demo' | 'streak' | 'points' | 'badge' | 'special';
  unlockedAt?: Timestamp;
  progress: number; // 0-100
  maxProgress: number;
  pointsReward: number;
}