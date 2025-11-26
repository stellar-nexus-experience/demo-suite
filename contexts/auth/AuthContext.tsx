'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useGlobalWallet } from '../wallet/WalletContext';
// Removed user-tracking-service import

export interface User {
  id: string;
  walletAddress: string;
  username?: string;
  customName?: string; // User's custom display name
  avatarSeed?: string; // Seed for generating consistent avatar
  email?: string;
  avatar?: string;
  createdAt: string;
  lastLoginAt: string;
  demoProgress: DemoProgress;
  badges: Badge[];
  level: number;
  experience: number;
}

export interface DemoProgress {
  [demoId: string]: {
    completed: boolean;
    completedAt?: string;
    stepsCompleted: number;
    totalSteps: number;
    score?: number;
    timeSpent: number; // in seconds
  };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'demo' | 'milestone' | 'achievement' | 'special';
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signUp: (walletAddress: string, username?: string, email?: string) => Promise<void>;
  signIn: (walletAddress: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  updateDemoProgress: (demoId: string, progress: Partial<DemoProgress[string]>) => Promise<void>;
  initializeUserWithFirebase: (username: string) => Promise<void>;
  addBadge: (badge: Omit<Badge, 'earnedAt'>) => Promise<void>;
  checkDemoCompletion: (demoId: string) => boolean;
  getUserStats: () => {
    totalDemosCompleted: number;
    totalTimeSpent: number;
    badgesEarned: number;
    level: number;
    experience: number;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { walletData, isConnected } = useGlobalWallet();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-sign in when wallet connects
  useEffect(() => {
    if (isConnected && walletData?.publicKey && !user) {
      // Check if user exists in localStorage
      const existingUser = localStorage.getItem(`user_${walletData.publicKey}`);
      if (existingUser) {
        try {
          const userData = JSON.parse(existingUser);
          setUser(userData);
        } catch (err) {}
      } else {
        // Auto-create user account when wallet connects
        const autoCreateUser = async () => {
          try {
            const defaultUsername = `User_${walletData.publicKey.slice(0, 8)}`;
            // Auto-create account is handled by Firebase context
          } catch (error) {}
        };

        autoCreateUser();
      }
    } else if (!isConnected && user) {
      // Sign out when wallet disconnects
      signOut();
    }
  }, [isConnected, walletData?.publicKey]);

  const signUp = async (
    walletAddress: string,
    username?: string,
    email?: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if user already exists
      const existingUser = localStorage.getItem(`user_${walletAddress}`);
      if (existingUser) {
        throw new Error('User already exists with this wallet address');
      }

      // Create new user
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        walletAddress,
        username: username || `User_${walletAddress.slice(-6)}`,
        email,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        demoProgress: {},
        badges: [],
        level: 1,
        experience: 0,
      };

      // Save to localStorage (will be replaced with Firebase later)
      localStorage.setItem(`user_${walletAddress}`, JSON.stringify(newUser));
      setUser(newUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (walletAddress: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const userData = localStorage.getItem(`user_${walletAddress}`);
      if (!userData) {
        throw new Error('No account found with this wallet address');
      }

      const user: User = JSON.parse(userData);
      user.lastLoginAt = new Date().toISOString();

      // Update last login time
      localStorage.setItem(`user_${walletAddress}`, JSON.stringify(user));
      setUser(user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setUser(null);
      setError(null);
    } catch (err) {}
  };

  const updateUser = async (updates: Partial<User>): Promise<void> => {
    if (!user) return;

    try {
      const updatedUser = { ...user, ...updates };
      localStorage.setItem(`user_${user.walletAddress}`, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      throw new Error('Failed to update user');
    }
  };

  const updateDemoProgress = async (
    demoId: string,
    progress: Partial<DemoProgress[string]>
  ): Promise<void> => {
    if (!user) return;

    try {
      const updatedProgress = {
        ...user.demoProgress,
        [demoId]: {
          ...user.demoProgress[demoId],
          ...progress,
        },
      };

      // Calculate experience gain
      let experienceGain = 0;
      if (progress.completed && !user.demoProgress[demoId]?.completed) {
        experienceGain = 100; // Base experience for completing a demo
        if (progress.score && progress.score > 80) {
          experienceGain += 50; // Bonus for high score
        }
      }

      const updatedUser = {
        ...user,
        demoProgress: updatedProgress,
        experience: user.experience + experienceGain,
        level: Math.floor((user.experience + experienceGain) / 500) + 1, // Level up every 500 XP
      };

      localStorage.setItem(`user_${user.walletAddress}`, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      throw new Error('Failed to update demo progress');
    }
  };

  const addBadge = async (badge: Omit<Badge, 'earnedAt'>): Promise<void> => {
    if (!user) return;

    try {
      const newBadge: Badge = {
        ...badge,
        earnedAt: new Date().toISOString(),
      };

      // Check if badge already exists
      const existingBadge = user.badges.find(b => b.id === badge.id);
      if (existingBadge) {
        return;
      }

      const updatedUser = {
        ...user,
        badges: [...user.badges, newBadge],
        experience: user.experience + 25, // Bonus XP for earning badges
      };

      localStorage.setItem(`user_${user.walletAddress}`, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      throw new Error('Failed to add badge');
    }
  };

  const checkDemoCompletion = (demoId: string): boolean => {
    return user?.demoProgress[demoId]?.completed || false;
  };

  const getUserStats = () => {
    if (!user) {
      return {
        totalDemosCompleted: 0,
        totalTimeSpent: 0,
        badgesEarned: 0,
        level: 1,
        experience: 0,
      };
    }

    const totalDemosCompleted = Object.values(user.demoProgress).filter(p => p.completed).length;
    const totalTimeSpent = Object.values(user.demoProgress).reduce(
      (sum, p) => sum + p.timeSpent,
      0
    );

    return {
      totalDemosCompleted,
      totalTimeSpent,
      badgesEarned: user.badges.length,
      level: user.level,
      experience: user.experience,
    };
  };

  const initializeUserWithFirebase = async (username: string): Promise<void> => {
    if (!walletData?.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);

      // Create user in local storage (existing logic)
      const newUser: User = {
        id: walletData.publicKey,
        walletAddress: walletData.publicKey,
        username,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        demoProgress: {},
        badges: [],
        level: 1,
        experience: 0,
      };

      localStorage.setItem(`user_${walletData.publicKey}`, JSON.stringify(newUser));
      setUser(newUser);
    } catch (err) {
      throw new Error('Failed to initialize user');
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    signUp,
    signIn,
    signOut,
    updateUser,
    updateDemoProgress,
    initializeUserWithFirebase,
    addBadge,
    checkDemoCompletion,
    getUserStats,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
