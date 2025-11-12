// Firebase context for managing user data and database operations
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useGlobalWallet } from '../wallet/WalletContext';
import { 
  accountService,
  demoStatsService,
  mandatoryFeedbackService,
  firebaseUtils
} from '../../lib/firebase/firebase-service';
import { 
  Account,
  DemoStats,
  MandatoryFeedback,
  PREDEFINED_DEMOS,
  PREDEFINED_BADGES,
  getBadgeById
} from '../../lib/firebase/firebase-types';

// DemoCard interface
interface DemoCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  isReady: boolean;
  multiStakeholderRequired: boolean;
}
import { useBadgeAnimation } from '../ui/BadgeAnimationContext';
import { useToast } from '../ui/ToastContext';
import { useTransactionHistory } from './TransactionContext';
//Nuevo
import { notificationService } from '@/lib/services/notification-service';



interface FirebaseContextType {
  // Account data
  account: Account | null;
  
  // Static data
  demos: DemoCard[];
  badges: typeof PREDEFINED_BADGES;
  demoStats: DemoStats[];
  
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  
  
  // Actions
  initializeAccount: (displayName: string, userEmail?: string) => Promise<void>;
  completeDemo: (demoId: string, score?: number, completionTimeMinutes?: number) => Promise<void>;
  hasBadge: (badgeId: string) => Promise<boolean>;
  hasCompletedDemo: (demoId: string) => Promise<boolean>;
  hasClappedDemo: (demoId: string) => Promise<boolean>;
  refreshAccountData: () => Promise<void>;
  clapDemo: (demoId: string) => Promise<void>;
  
  // Mandatory feedback actions
  submitMandatoryFeedback: (feedbackData: Omit<MandatoryFeedback, 'id' | 'userId' | 'timestamp'>) => Promise<string>;
  hasUserSubmittedFeedback: (demoId: string) => Promise<boolean>;
  getUserFeedback: () => Promise<MandatoryFeedback[]>;
  getDemoFeedbackStats: (demoId: string) => Promise<{
    totalFeedback: number;
    averageRating: number;
    averageCompletionTime: number;
    difficultyDistribution: Record<string, number>;
    recommendationRate: number;
  }>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { walletData } = useGlobalWallet();
  const { showBadgeAnimation } = useBadgeAnimation();
  const { addToast } = useToast();
  const { addTransaction, refreshTransactions } = useTransactionHistory();
  
  // State
  const [account, setAccount] = useState<Account | null>(null);
  const [demoStats, setDemoStats] = useState<DemoStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize account data when wallet connects
  useEffect(() => {
    const initializeFirebase = async () => {
      // Always load demo stats (public data)
      try {
        await loadDemoStats();
      } catch (error) {
        console.error('Error loading demo stats:', error);
      }
      
      if (!walletData?.publicKey) {
        // Clear account data when wallet disconnects
        setAccount(null);
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        
        // Check if account exists
        const existingAccount = await accountService.getAccountByWalletAddress(walletData.publicKey);
        
        if (!existingAccount) {
          // Create new account
          await firebaseUtils.createAccount(
            walletData.publicKey,
            user?.customName || user?.username || 'Anonymous User',
            walletData.network || 'testnet'
          );
          
          // Award Welcome Explorer badge for new account
          await accountService.addEarnedBadge(walletData.publicKey, 'welcome_explorer');
          
          // Add experience and points for account creation
          await accountService.addExperienceAndPoints(walletData.publicKey, 20, 10);
          
          
          // Show Welcome badge animation
          const welcomeBadge = getBadgeById('welcome_explorer');
          if (welcomeBadge) {
            showBadgeAnimation({
              ...welcomeBadge,
              earnedAt: new Date().toISOString(),
              rarity: welcomeBadge.rarity as 'common' | 'rare' | 'epic' | 'legendary',
              category: welcomeBadge.category as 'demo' | 'milestone' | 'achievement' | 'special'
            }, welcomeBadge.earningPoints);
          }
        } else {
          // Update last login
          await accountService.createOrUpdateAccount({
            id: walletData.publicKey,
            lastLoginAt: new Date(),
          });
          
        }
        
        // Load account data (demo stats already loaded above)
        await loadAccountData();
        setIsInitialized(true);
      } catch (error) {
        addToast({
          title: 'Error',
          message: 'Failed to initialize account.',
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeFirebase();
  }, [walletData?.publicKey, user?.username, addToast]);

  // Load account data
  const loadAccountData = async () => {
    if (!walletData?.publicKey) return;
    
    try {
      const accountData = await accountService.getAccountByWalletAddress(walletData.publicKey);
      setAccount(accountData);
    } catch (error) {
      console.error('Error loading account data:', error);
      addToast({
        title: 'Error',
        message: 'Failed to load account data.',
        type: 'error',
      });
    }
  };

  // Load demo stats
  const loadDemoStats = async () => {
    try {
      let stats = await demoStatsService.getAllDemoStats();
      
      // If no stats exist, initialize them for all demos
      if (stats.length === 0) {
        const demos = [
          { id: 'hello-milestone', name: 'Baby Steps to Riches' },
          { id: 'dispute-resolution', name: 'Drama Queen Escrow' },
          { id: 'micro-marketplace', name: 'Gig Economy Madness' },
          { id: 'nexus-master', name: 'Nexus Master Achievement' },
        ];
        
        for (const demo of demos) {
          try {
            await demoStatsService.initializeDemoStats(demo.id, demo.name);
          } catch (error) {
            // Failed to initialize stats
          }
        }
        
        // Reload stats after initialization
        stats = await demoStatsService.getAllDemoStats();
      }
      
      setDemoStats(stats);
    } catch (error) {
      console.error('Error loading demo stats:', error);
      // Don't show error toast for demo stats as it's not critical
    }
  };

  // Initialize account (called from AuthModal)
  const initializeAccount = async (displayName: string, userEmail?: string) => {
    if (!walletData?.publicKey) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    try {
      // Check if account already exists
      const existingAccount = await accountService.getAccountByWalletAddress(walletData.publicKey);
      
      if (!existingAccount) {
        // Create new account
        await firebaseUtils.createAccount(
          walletData.publicKey,
          displayName,
          walletData.network || 'testnet'
        );
        
        // Award Welcome Explorer badge for new account
        await accountService.addEarnedBadge(walletData.publicKey, 'welcome_explorer');
        
        // Add experience and points for account creation
        await accountService.addExperienceAndPoints(walletData.publicKey, 20, 10);
        
        
        // Show Welcome badge animation
        const welcomeBadge = getBadgeById('welcome_explorer');
        if (welcomeBadge) {
          showBadgeAnimation({
            ...welcomeBadge,
            earnedAt: new Date().toISOString(),
            rarity: welcomeBadge.rarity as 'common' | 'rare' | 'epic' | 'legendary',
            category: welcomeBadge.category as 'demo' | 'milestone' | 'achievement' | 'special'
          }, welcomeBadge.earningPoints);
        }
        
        addToast({
          title: 'Welcome!',
          message: `Account created for ${displayName}. You earned the Welcome Explorer badge!`,
          type: 'success',
        });
      } else {
        // Account already exists, just update last login
        await accountService.createOrUpdateAccount({
          id: walletData.publicKey,
          lastLoginAt: new Date(),
        });
        
        addToast({
          title: 'Welcome Back!',
          message: `Welcome back, ${displayName}!`,
          type: 'success',
        });
      }
      
      await Promise.all([loadAccountData(), loadDemoStats()]);
      setIsInitialized(true);
    } catch (error) {
      addToast({
        title: 'Error',
        message: 'Failed to create account.',
        type: 'error',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Complete demo
  const completeDemo = async (demoId: string, score?: number, completionTimeMinutes?: number) => {
    if (!walletData?.publicKey || !account) return;
    
    try {
      
      // Handle both array and object formats for demosCompleted (Firebase sometimes stores arrays as objects)
      let demosCompletedArray: string[] = [];
      if (Array.isArray(account.demosCompleted)) {
        demosCompletedArray = account.demosCompleted;
      } else if (account.demosCompleted && typeof account.demosCompleted === 'object') {
        demosCompletedArray = Object.values(account.demosCompleted);
      }
      
      // Check if demo already completed
      if (demosCompletedArray.includes(demoId)) {
        return;
      }

      // Calculate points based on score (default 100 if no score provided)
      const basePoints = 100;
      const finalScore = score || 85; // Default score if not provided
      const scoreMultiplier = Math.max(0.5, finalScore / 100);
      const pointsEarned = Math.round(basePoints * scoreMultiplier);
      
      // Add demo to completed list in account (but not for nexus-master as it's not a real demo)
      if (demoId !== 'nexus-master') {
        await accountService.addCompletedDemo(walletData.publicKey, demoId);
      }
      
      // Add experience and points (experience is 2x points)
      // 🎯 MODIFICACIÓN 1: Definir xpEarned aquí para la notificación
      const xpEarned = pointsEarned * 2; //👀
      await accountService.addExperienceAndPoints(walletData.publicKey, pointsEarned * 2, pointsEarned);


      // Update demo stats for global tracking
      try {
        await demoStatsService.incrementCompletion(demoId, completionTimeMinutes, finalScore);
      } catch (statsError) {
        console.error('FirebaseContext: Failed to update demo stats:', statsError);
        // Don't fail the demo completion if stats tracking fails
      }

      
      
      // Award appropriate badge based on demo
      let badgeToAward = '';
      let demoName = ''; 
      switch (demoId) {
        case 'hello-milestone':
          badgeToAward = 'escrow_expert';
          break;
        case 'dispute-resolution':
          badgeToAward = 'trust_guardian';
          break;
        case 'micro-marketplace':
          badgeToAward = 'stellar_champion';
          break;
        case 'nexus-master':
          badgeToAward = 'nexus_master';
          break;
      }
      
      if (badgeToAward) {
        await accountService.addEarnedBadge(walletData.publicKey, badgeToAward);

        // 🎯 INTEGRACIÓN DE NOTIFICACIÓN DE DEMOSTRACIÓN 🎯

        // 1. Obtener la definición de la insignia usando la función importada
        const badgeDefinition = getBadgeById(badgeToAward);

        // 2. Obtener el nombre legible para la notificación
        const badgeName = badgeDefinition?.name || badgeToAward;

        // 3. Llamar al servicio de notificación (Asumiendo que notificationService está importado)
        await notificationService.notifyDemoCompleted(
          account.id,
          demoId,
          demoName, // Nombre legible
          xpEarned,
          pointsEarned,
          badgeName // Nombre legible de la insignia
        );
        
    

        
        // Show badge animation
        const badge = getBadgeById(badgeToAward);
        if (badge) {
          showBadgeAnimation({
            ...badge,
            earnedAt: new Date().toISOString(),
            rarity: badge.rarity as 'common' | 'rare' | 'epic' | 'legendary',
            category: badge.category as 'demo' | 'milestone' | 'achievement' | 'special'
          }, badge.earningPoints);
        }
      }

      // Check if all 3 demos completed to unlock Nexus Master demo card
      const updatedAccount = await accountService.getAccountByWalletAddress(walletData.publicKey);
      
      // Handle both array and object formats for demosCompleted
      let updatedDemosCompletedArray: string[] = [];
      if (Array.isArray(updatedAccount?.demosCompleted)) {
        updatedDemosCompletedArray = updatedAccount.demosCompleted;
      } else if (updatedAccount?.demosCompleted && typeof updatedAccount.demosCompleted === 'object') {
        updatedDemosCompletedArray = Object.values(updatedAccount.demosCompleted);
      }
      
      if (updatedAccount && updatedDemosCompletedArray.length === 3) {
        // Note: Nexus Master badge is NOT auto-awarded here
        // It will only be awarded when user manually claims it from the 4th demo card
      }

      // Add demo completion transaction to history
      try {
        await addTransaction({
          hash: `demo-completion-${demoId}-${Date.now()}`,
          status: 'success',
          message: `Completed ${demoId.replace('-', ' ')} demo`,
          type: 'demo_completion',
          demoId: demoId,
          points: pointsEarned,
        });

        // Add badge earning transaction if badge was awarded
        if (badgeToAward) {
          const earnedBadge = getBadgeById(badgeToAward);
          await addTransaction({
            hash: `badge-earned-${badgeToAward}-${Date.now()}`,
            status: 'success',
            message: `Earned ${badgeToAward.replace('_', ' ')} badge`,
            type: 'badge_earned',
            badgeId: badgeToAward,
            points: earnedBadge ? earnedBadge.earningPoints : 0,
          });
        }
      } catch (transactionError) {
        console.error('FirebaseContext: Failed to add transaction to history:', transactionError);
        // Don't fail the demo completion if transaction logging fails
      }
      
      // Refresh account data and demo stats
      await Promise.all([loadAccountData(), loadDemoStats()]);
    } catch (error) {
      addToast({
        title: 'Error',
        message: 'Failed to complete demo.',
        type: 'error',
      });
    }
  };

  // Check if account has badge
  const hasBadge = async (badgeId: string): Promise<boolean> => {
    if (!walletData?.publicKey) return false;
    
    try {
      return await accountService.hasBadge(walletData.publicKey, badgeId);
    } catch (error) {
      return false;
    }
  };

  // Check if account has completed demo
  const hasCompletedDemo = async (demoId: string): Promise<boolean> => {
    if (!walletData?.publicKey) return false;
    
    try {
      return await accountService.hasCompletedDemo(walletData.publicKey, demoId);
    } catch (error) {
      return false;
    }
  };

  // Check if account has clapped for demo
  const hasClappedDemo = async (demoId: string): Promise<boolean> => {
    if (!walletData?.publicKey) return false;
    
    try {
      return await accountService.hasClappedDemo(walletData.publicKey, demoId);
    } catch (error) {
      return false;
    }
  };

  // Refresh account data
  const refreshAccountData = async () => {
    await Promise.all([loadAccountData(), loadDemoStats()]);
  };

  // Clap a demo
  const clapDemo = async (demoId: string) => {
    if (!walletData?.publicKey) {
      addToast({
        title: 'Error',
        message: 'Please connect your wallet to clap for demos.',
        type: 'error',
      });
      return;
    }

    try {
      await demoStatsService.incrementClap(demoId, walletData.publicKey);
      await Promise.all([loadAccountData(), loadDemoStats()]); // Refresh both account data and demo stats
      
      addToast({
        title: '👏 Demo Clapped!',
        message: 'Thanks for showing your appreciation!',
        type: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to clap demo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to clap demo. Please try again.';
      addToast({
        title: 'Error',
        message: errorMessage,
        type: 'error',
      });
    }
  };

  // Submit mandatory feedback
  const submitMandatoryFeedback = async (feedbackData: Omit<MandatoryFeedback, 'id' | 'userId' | 'timestamp'>): Promise<string> => {
    if (!walletData?.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const feedbackId = await mandatoryFeedbackService.submitFeedback({
        ...feedbackData,
        userId: walletData.publicKey,
      });

      addToast({
        title: '✅ Feedback Submitted!',
        message: 'Thank you for your valuable feedback!',
        type: 'success',
        duration: 3000,
      });

      return feedbackId;
    } catch (error) {
      console.error('Failed to submit mandatory feedback:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback. Please try again.';
      addToast({
        title: 'Error',
        message: errorMessage,
        type: 'error',
      });
      throw error;
    }
  };

  // Check if user has submitted feedback for a demo
  const hasUserSubmittedFeedback = async (demoId: string): Promise<boolean> => {
    if (!walletData?.publicKey) return false;
    
    try {
      return await mandatoryFeedbackService.hasUserSubmittedFeedback(walletData.publicKey, demoId);
    } catch (error) {
      console.error('Failed to check feedback submission:', error);
      return false;
    }
  };

  // Get user's feedback history
  const getUserFeedback = async (): Promise<MandatoryFeedback[]> => {
    if (!walletData?.publicKey) return [];
    
    try {
      return await mandatoryFeedbackService.getUserFeedback(walletData.publicKey);
    } catch (error) {
      console.error('Failed to get user feedback:', error);
      return [];
    }
  };

  // Get demo feedback statistics
  const getDemoFeedbackStats = async (demoId: string) => {
    try {
      return await mandatoryFeedbackService.getDemoFeedbackStats(demoId);
    } catch (error) {
      console.error('Failed to get demo feedback stats:', error);
      return {
        totalFeedback: 0,
        averageRating: 0,
        averageCompletionTime: 0,
        difficultyDistribution: {},
        recommendationRate: 0,
      };
    }
  };

  // Convert PREDEFINED_DEMOS to DemoCard format
  const demos: DemoCard[] = [
    {
      id: 'hello-milestone',
      title: '1. Baby Steps to Riches',
      subtitle: 'Basic Escrow Flow Demo',
      description: PREDEFINED_DEMOS[0].description,
      icon: '🎮',
      color: 'from-brand-500 to-brand-400',
      isReady: true,
      multiStakeholderRequired: false,
    },
    {
      id: 'dispute-resolution',
      title: '2. Drama Queen Escrow',
      subtitle: 'Dispute Resolution & Arbitration',
      description: PREDEFINED_DEMOS[1].description,
      icon: '🎮',
      color: 'from-warning-500 to-warning-400',
      isReady: true,
      multiStakeholderRequired: false,
    },
    {
      id: 'micro-marketplace',
      title: '3. Gig Economy Madness',
      subtitle: 'Micro-Task Marketplace',
      description: PREDEFINED_DEMOS[2].description,
      icon: '🎮',
      color: 'from-accent-500 to-accent-400',
      isReady: true,
      multiStakeholderRequired: false,
    },
    {
      id: 'nexus-master',
      title: 'Nexus Master Achievement',
      subtitle: 'Complete All Main Badges',
      description: 'The ultimate achievement! Complete all three main demos to unlock the legendary Nexus Master badge and claim your place among the elite.',
      icon: '/images/demos/economy.png',
      color: 'from-gray-500 to-gray-400',
      isReady: false,
      multiStakeholderRequired: false,
    },
  ];

  const value: FirebaseContextType = {
    account,
    demos,
    badges: PREDEFINED_BADGES,
    demoStats,
    isLoading,
    isInitialized,
    initializeAccount,
    completeDemo,
    hasBadge,
    hasCompletedDemo,
    hasClappedDemo,
    refreshAccountData,
    clapDemo,
    submitMandatoryFeedback,
    hasUserSubmittedFeedback,
    getUserFeedback,
    getDemoFeedbackStats,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};
