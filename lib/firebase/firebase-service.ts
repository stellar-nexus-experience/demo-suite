// Firebase Firestore service functions
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Account, TransactionRecord, DemoStats, MandatoryFeedback, GameScore, COLLECTIONS } from './firebase-types';
import { cleanObject } from '../../contexts/data/TransactionContext';
// Helper function to convert Firestore timestamps to Date objects
const convertTimestamps = (data: any): any => {
  if (!data) return data;

  const converted = { ...data };
  Object.keys(converted).forEach(key => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    } else if (typeof converted[key] === 'object' && converted[key] !== null) {
      converted[key] = convertTimestamps(converted[key]);
    }
  });
  return converted;
};

// Account Service - Single service for all account operations
export const accountService = {
  // Create or update account
  async createOrUpdateAccount(accountData: Partial<Account>): Promise<void> {
    const accountRef = doc(db, COLLECTIONS.ACCOUNTS, accountData.id!);
    
    // Get existing account to preserve fields
    const existingDoc = await getDoc(accountRef);
    const existingData = existingDoc.exists() ? existingDoc.data() : {};
    
    const accountDoc = {
      ...accountData,
      // Initialize new fields if they don't exist (match Firebase example structure)
      completedQuests: accountData.completedQuests || existingData.completedQuests || [],
      questProgress: accountData.questProgress || existingData.questProgress || {},
      // Only preserve existing profile if it exists, don't create empty one
      ...(existingData.profile && { profile: existingData.profile }),
      stats: accountData.stats || existingData.stats || {
        totalPoints: accountData.totalPoints || 0,
        lastActiveDate: new Date().toISOString().split('T')[0],
      },
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };
    await setDoc(accountRef, accountDoc, { merge: true });
  },

  // Get account by wallet address
  async getAccountByWalletAddress(walletAddress: string): Promise<Account | null> {
    const accountRef = doc(db, COLLECTIONS.ACCOUNTS, walletAddress);
    const accountSnap = await getDoc(accountRef);

    if (accountSnap.exists()) {
      const accountData = convertTimestamps(accountSnap.data());
      const account = { id: accountSnap.id, ...accountData } as Account;

      // Ensure new fields are initialized for existing accounts
      if (!account.completedQuests) {
        account.completedQuests = [];
      }
      if (!account.questProgress) {
        account.questProgress = {};
      }

      return account;
    }
    return null;
  },

  // Update account progress
  async updateAccountProgress(
    walletAddress: string,
    progress: Partial<
      Pick<
        Account,
        'level' | 'experience' | 'totalPoints' | 'demosCompleted' | 'badgesEarned' | 'clappedDemos'
      >
    >
  ): Promise<void> {
    const accountRef = doc(db, COLLECTIONS.ACCOUNTS, walletAddress);
    await updateDoc(accountRef, {
      ...progress,
      updatedAt: serverTimestamp(),
    });
  },

  // Add completed demo
  async addCompletedDemo(walletAddress: string, demoId: string): Promise<void> {
    const account = await this.getAccountByWalletAddress(walletAddress);
    if (account) {
      let currentDemosCompleted: string[] = [];

      if (Array.isArray(account.demosCompleted)) {
        currentDemosCompleted = account.demosCompleted;
      } else if (account.demosCompleted && typeof account.demosCompleted === 'object') {
        // Convert object to array (Firebase sometimes stores arrays as objects)
        currentDemosCompleted = Object.values(account.demosCompleted);
      }

      if (!currentDemosCompleted.includes(demoId)) {
        const updatedDemosCompleted = [...currentDemosCompleted, demoId];
        await this.updateAccountProgress(walletAddress, {
          demosCompleted: updatedDemosCompleted,
        });
      }
    }
  },

  // Add earned badge
  async addEarnedBadge(walletAddress: string, badgeId: string): Promise<void> {
    const account = await this.getAccountByWalletAddress(walletAddress);
    if (account) {
      let currentBadgesEarned: string[] = [];

      if (Array.isArray(account.badgesEarned)) {
        currentBadgesEarned = account.badgesEarned;
      } else if (account.badgesEarned && typeof account.badgesEarned === 'object') {
        // Convert object to array (Firebase sometimes stores arrays as objects)
        currentBadgesEarned = Object.values(account.badgesEarned);
      }

      if (!currentBadgesEarned.includes(badgeId)) {
        const updatedBadgesEarned = [...currentBadgesEarned, badgeId];
        await this.updateAccountProgress(walletAddress, {
          badgesEarned: updatedBadgesEarned,
        });
      }
    }
  },

  // Add experience and points
  async addExperienceAndPoints(
    walletAddress: string,
    experience: number,
    points: number
  ): Promise<void> {
    const account = await this.getAccountByWalletAddress(walletAddress);
    if (account) {
      const newExperience = account.experience + experience;
      const newTotalPoints = account.totalPoints + points;
      const newLevel = Math.floor(newExperience / 1000) + 1;

      // Update root-level fields and stats
      const accountRef = doc(db, COLLECTIONS.ACCOUNTS, walletAddress);
      const updateData: any = {
        experience: newExperience,
        totalPoints: newTotalPoints,
        level: newLevel,
        'stats.totalPoints': newTotalPoints, // Update nested stats.totalPoints
        'stats.lastActiveDate': new Date().toISOString().split('T')[0], // Update last active date
        updatedAt: serverTimestamp(),
      };

      // Only update profile.level if profile object exists
      if (account.profile) {
        updateData['profile.level'] = newLevel;
      }

      await updateDoc(accountRef, updateData);
    }
  },

  // Check if account has badge
  async hasBadge(walletAddress: string, badgeId: string): Promise<boolean> {
    const account = await this.getAccountByWalletAddress(walletAddress);
    return account && account.badgesEarned && Array.isArray(account.badgesEarned)
      ? account.badgesEarned.includes(badgeId)
      : false;
  },

  // Check if account has completed demo
  async hasCompletedDemo(walletAddress: string, demoId: string): Promise<boolean> {
    const account = await this.getAccountByWalletAddress(walletAddress);
    return account && account.demosCompleted && Array.isArray(account.demosCompleted)
      ? account.demosCompleted.includes(demoId)
      : false;
  },

  // Add clapped demo
  async addClappedDemo(walletAddress: string, demoId: string): Promise<void> {
    const account = await this.getAccountByWalletAddress(walletAddress);
    if (account) {
      let currentClappedDemos: string[] = [];

      if (Array.isArray(account.clappedDemos)) {
        currentClappedDemos = account.clappedDemos;
      } else if (account.clappedDemos && typeof account.clappedDemos === 'object') {
        // Convert object to array (Firebase sometimes stores arrays as objects)
        currentClappedDemos = Object.values(account.clappedDemos);
      }

      if (!currentClappedDemos.includes(demoId)) {
        const updatedClappedDemos = [...currentClappedDemos, demoId];
        await this.updateAccountProgress(walletAddress, {
          clappedDemos: updatedClappedDemos,
        });
      }
    }
  },

  // Check if account has clapped for demo
  async hasClappedDemo(walletAddress: string, demoId: string): Promise<boolean> {
    const account = await this.getAccountByWalletAddress(walletAddress);

    if (!account || !account.clappedDemos) return false;

    // Handle both array and object formats
    if (Array.isArray(account.clappedDemos)) {
      return account.clappedDemos.includes(demoId);
    } else if (typeof account.clappedDemos === 'object') {
      const clappedDemosArray = Object.values(account.clappedDemos);
      return clappedDemosArray.includes(demoId);
    }

    return false;
  },


  // Add transaction to user's history
  async addTransaction(
    walletAddress: string,
    transaction: Omit<TransactionRecord, 'timestamp' | 'walletAddress'>
  ): Promise<void> {
    const account = await this.getAccountByWalletAddress(walletAddress);
    if (!account) {
      throw new Error('Account not found');
    }

    const newTransaction: Omit<TransactionRecord, 'id'> = {
      ...transaction,
      timestamp: new Date(),
      walletAddress,
    };

    // Add to transactions collection
    const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS);
    await addDoc(transactionsRef, {
      ...newTransaction,
      timestamp: serverTimestamp(),
    });
  },

  // Update transaction status
  async updateTransaction(
    walletAddress: string,
    transactionHash: string,
    status: 'success' | 'failed',
    message: string
  ): Promise<void> {
    
    // 1. Define la referencia a la colección y la consulta (query)
    const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS);
    const q = query(
      transactionsRef,
      where('walletAddress', '==', walletAddress),
      where('hash', '==', transactionHash)
    );
    
    // 2. Ejecutar la consulta
    const querySnapshot = await getDocs(q); 
    
    
    if (querySnapshot.empty) {
        console.warn('Transaction not found to update:', transactionHash);
        return;
    }

    // 4. Crear y limpiar el objeto de actualización
    // ⬇️ OBJETO DE ACTUALIZACIÓN LIMPIO ⬇️
    const updateData = cleanObject({ status, message });
    
    
    querySnapshot.forEach(async (doc) => {
        
        await updateDoc(doc.ref, updateData);
    });
}
,
  // Get user's transaction history
  async getUserTransactions(
    walletAddress: string,
    limitCount?: number
  ): Promise<TransactionRecord[]> {
    const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS);
    let q = query(
      transactionsRef,
      where('walletAddress', '==', walletAddress),
      orderBy('timestamp', 'desc')
    );

    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    const transactions: TransactionRecord[] = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...convertTimestamps(data),
      } as TransactionRecord);
    });

    return transactions;
  },

  // Get transactions by type
  async getTransactionsByType(
    walletAddress: string,
    type: TransactionRecord['type']
  ): Promise<TransactionRecord[]> {
    const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS);
    const q = query(
      transactionsRef,
      where('walletAddress', '==', walletAddress),
      where('type', '==', type),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const transactions: TransactionRecord[] = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...convertTimestamps(data),
      } as TransactionRecord);
    });

    return transactions;
  },

  // Get transactions by demo
  async getTransactionsByDemo(walletAddress: string, demoId: string): Promise<TransactionRecord[]> {
    const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS);
    const q = query(
      transactionsRef,
      where('walletAddress', '==', walletAddress),
      where('demoId', '==', demoId),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const transactions: TransactionRecord[] = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...convertTimestamps(data),
      } as TransactionRecord);
    });

    return transactions;
  },

  // Get all accounts (for analytics)
  async getAllAccounts(): Promise<Account[]> {
    const accountsRef = collection(db, COLLECTIONS.ACCOUNTS);
    const querySnapshot = await getDocs(accountsRef);
    const accounts: Account[] = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      accounts.push({
        id: doc.id,
        ...convertTimestamps(data),
      } as Account);
    });

    return accounts;
  },
};

// Demo Stats Service - for tracking demo completion and engagement statistics
export const demoStatsService = {
  // Get demo stats by demo ID
  async getDemoStats(demoId: string): Promise<DemoStats | null> {
    const demoStatsRef = doc(db, COLLECTIONS.DEMO_STATS, demoId);
    const demoStatsSnap = await getDoc(demoStatsRef);

    if (demoStatsSnap.exists()) {
      return convertTimestamps(demoStatsSnap.data()) as DemoStats;
    }
    return null;
  },

  // Get all demo stats
  async getAllDemoStats(): Promise<DemoStats[]> {
    const demoStatsRef = collection(db, COLLECTIONS.DEMO_STATS);
    const querySnapshot = await getDocs(demoStatsRef);
    const stats: DemoStats[] = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      const processedStat = {
        id: doc.id,
        ...convertTimestamps(data),
      } as DemoStats;
      stats.push(processedStat);
    });

    return stats;
  },

  // Initialize demo stats for a demo (called when demo is first accessed)
  async initializeDemoStats(demoId: string, demoName: string): Promise<void> {
    const demoStatsRef = doc(db, COLLECTIONS.DEMO_STATS, demoId);
    const existingStats = await this.getDemoStats(demoId);

    if (!existingStats) {
      const newStats: Omit<DemoStats, 'id'> = {
        demoId,
        demoName,
        totalCompletions: 0,
        totalClaps: 0,
        totalRatings: 0,
        averageRating: 0,
        averageCompletionTime: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(demoStatsRef, {
        ...newStats,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  },

  // Increment completion count
  async incrementCompletion(
    demoId: string,
    completionTimeMinutes?: number,
    rating?: number
  ): Promise<void> {
    const demoStatsRef = doc(db, COLLECTIONS.DEMO_STATS, demoId);
    const existingStats = await this.getDemoStats(demoId);

    if (!existingStats) {
      // Initialize if doesn't exist
      const demoName = this.getDemoName(demoId);
      await this.initializeDemoStats(demoId, demoName);
    }

    // Get updated stats after initialization
    const currentStats = await this.getDemoStats(demoId);
    if (!currentStats) return;

    // Calculate new averages
    const newTotalCompletions = currentStats.totalCompletions + 1;
    const newTotalRatings =
      rating !== undefined ? currentStats.totalRatings + 1 : currentStats.totalRatings;

    // Calculate new average rating
    let newAverageRating = currentStats.averageRating;
    if (rating !== undefined) {
      const totalRatingPoints = currentStats.averageRating * currentStats.totalRatings + rating;
      newAverageRating = newTotalRatings > 0 ? totalRatingPoints / newTotalRatings : 0;
    }

    // Calculate new average completion time
    let newAverageCompletionTime = currentStats.averageCompletionTime;
    if (completionTimeMinutes !== undefined) {
      const totalCompletionTime =
        currentStats.averageCompletionTime * currentStats.totalCompletions + completionTimeMinutes;
      newAverageCompletionTime =
        newTotalCompletions > 0 ? totalCompletionTime / newTotalCompletions : 0;
    }

    await updateDoc(demoStatsRef, {
      totalCompletions: newTotalCompletions,
      totalRatings: newTotalRatings,
      averageRating: newAverageRating,
      averageCompletionTime: newAverageCompletionTime,
      updatedAt: serverTimestamp(),
    });
  },

  // Increment clap count
  async incrementClap(demoId: string, walletAddress: string): Promise<void> {
    // Check if user has already clapped for this demo
    const hasClapped = await accountService.hasClappedDemo(walletAddress, demoId);
    if (hasClapped) {
      throw new Error('User has already clapped for this demo');
    }

    const demoStatsRef = doc(db, COLLECTIONS.DEMO_STATS, demoId);
    const existingStats = await this.getDemoStats(demoId);

    if (!existingStats) {
      // Initialize if doesn't exist
      const demoName = this.getDemoName(demoId);
      await this.initializeDemoStats(demoId, demoName);
    }

    // Add clap to demo stats
    const updatedStats = await this.getDemoStats(demoId);
    await updateDoc(demoStatsRef, {
      totalClaps: updatedStats ? updatedStats.totalClaps + 1 : 1,
      updatedAt: serverTimestamp(),
    });

    // Add clap to user's clapped demos list
    await accountService.addClappedDemo(walletAddress, demoId);
  },

  // Helper function to get demo name
  getDemoName(demoId: string): string {
    const demoNames: Record<string, string> = {
      'hello-milestone': 'Baby Steps to Riches',
      'dispute-resolution': 'Drama Queen Escrow',
      'micro-marketplace': 'Gig Economy Madness',
      'nexus-master': 'Nexus Master Achievement',
    };
    return demoNames[demoId] || demoId;
  },
};

// Mandatory Feedback Service - for tracking mandatory feedback submissions
export const mandatoryFeedbackService = {
  // Submit mandatory feedback
  async submitFeedback(feedbackData: Omit<MandatoryFeedback, 'id' | 'timestamp'>): Promise<string> {
    const feedbackRef = collection(db, COLLECTIONS.MANDATORY_FEEDBACK);
    const docRef = await addDoc(feedbackRef, {
      ...feedbackData,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  },

  // Get feedback by user and demo
  async getFeedbackByUserAndDemo(userId: string, demoId: string): Promise<MandatoryFeedback | null> {
    const feedbackRef = collection(db, COLLECTIONS.MANDATORY_FEEDBACK);
    const q = query(
      feedbackRef,
      where('userId', '==', userId),
      where('demoId', '==', demoId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...convertTimestamps(data),
      } as MandatoryFeedback;
    }
    return null;
  },

  // Get all feedback for a user
  async getUserFeedback(userId: string): Promise<MandatoryFeedback[]> {
    const feedbackRef = collection(db, COLLECTIONS.MANDATORY_FEEDBACK);
    const q = query(
      feedbackRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const feedback: MandatoryFeedback[] = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      feedback.push({
        id: doc.id,
        ...convertTimestamps(data),
      } as MandatoryFeedback);
    });

    return feedback;
  },

  // Get all feedback for a demo
  async getDemoFeedback(demoId: string): Promise<MandatoryFeedback[]> {
    const feedbackRef = collection(db, COLLECTIONS.MANDATORY_FEEDBACK);
    const q = query(
      feedbackRef,
      where('demoId', '==', demoId),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const feedback: MandatoryFeedback[] = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      feedback.push({
        id: doc.id,
        ...convertTimestamps(data),
      } as MandatoryFeedback);
    });

    return feedback;
  },

  // Get feedback statistics for a demo
  async getDemoFeedbackStats(demoId: string): Promise<{
    totalFeedback: number;
    averageRating: number;
    averageCompletionTime: number;
    difficultyDistribution: Record<string, number>;
    recommendationRate: number;
  }> {
    const feedback = await this.getDemoFeedback(demoId);
    
    if (feedback.length === 0) {
      return {
        totalFeedback: 0,
        averageRating: 0,
        averageCompletionTime: 0,
        difficultyDistribution: {},
        recommendationRate: 0,
      };
    }

    const totalRating = feedback.reduce((sum, f) => sum + f.rating, 0);
    const totalCompletionTime = feedback.reduce((sum, f) => sum + f.completionTime, 0);
    const recommendations = feedback.filter(f => f.wouldRecommend).length;
    
    const difficultyDistribution = feedback.reduce((acc, f) => {
      acc[f.difficulty] = (acc[f.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalFeedback: feedback.length,
      averageRating: totalRating / feedback.length,
      averageCompletionTime: totalCompletionTime / feedback.length,
      difficultyDistribution,
      recommendationRate: (recommendations / feedback.length) * 100,
    };
  },

  // Check if user has submitted feedback for a demo
  async hasUserSubmittedFeedback(userId: string, demoId: string): Promise<boolean> {
    const feedback = await this.getFeedbackByUserAndDemo(userId, demoId);
    return feedback !== null;
  },

  // Get recent feedback (for admin/analytics)
  async getRecentFeedback(limitCount: number = 50): Promise<MandatoryFeedback[]> {
    const feedbackRef = collection(db, COLLECTIONS.MANDATORY_FEEDBACK);
    const q = query(
      feedbackRef,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const feedback: MandatoryFeedback[] = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      feedback.push({
        id: doc.id,
        ...convertTimestamps(data),
      } as MandatoryFeedback);
    });

    return feedback;
  },
};

// Firebase Utility Functions

// Utility functions
export const firebaseUtils = {
  // Calculate level from experience (1000 XP per level)
  calculateLevel(experience: number): number {
    return Math.floor(experience / 1000) + 1;
  },

  // Create account - matches exact Firebase structure from example
  async createAccount(
    walletAddress: string,
    displayName: string,
    network: string = 'testnet'
  ): Promise<void> {
    const accountData: Partial<Account> = {
      id: walletAddress,
      displayName,
      walletAddress,
      network: network.toUpperCase(), // Match "TESTNET" format
      level: 1,
      experience: 0,
      totalPoints: 0,
      demosCompleted: [],
      badgesEarned: [],
      clappedDemos: [],
      completedQuests: [],
      questProgress: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    };

    await accountService.createOrUpdateAccount(accountData);
  },
};

// Game Scores Service - for tracking high scores across all games
export const gameScoresService = {
  // Submit a new game score
  async submitScore(
    gameId: string,
    userId: string,
    username: string,
    score: number,
    level: number = 1,
    metadata?: GameScore['metadata']
  ): Promise<string> {
    const scoresRef = collection(db, COLLECTIONS.GAME_SCORES);
    const docRef = await addDoc(scoresRef, {
      gameId,
      userId,
      username,
      score,
      level,
      metadata: metadata || {},
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  },

  // Get top scores for a specific game
  async getTopScores(gameId: string, limitCount: number = 10): Promise<GameScore[]> {
    const scoresRef = collection(db, COLLECTIONS.GAME_SCORES);
    const q = query(
      scoresRef,
      where('gameId', '==', gameId),
      orderBy('score', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const scores: GameScore[] = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      scores.push({
        id: doc.id,
        ...convertTimestamps(data),
      } as GameScore);
    });

    return scores;
  },

  // Get user's best score for a specific game
  async getUserBestScore(gameId: string, userId: string): Promise<GameScore | null> {
    const scoresRef = collection(db, COLLECTIONS.GAME_SCORES);
    const q = query(
      scoresRef,
      where('gameId', '==', gameId),
      where('userId', '==', userId),
      orderBy('score', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...convertTimestamps(data),
    } as GameScore;
  },

  // Get user's rank for a specific game
  async getUserRank(gameId: string, userId: string): Promise<number> {
    const userBestScore = await this.getUserBestScore(gameId, userId);
    if (!userBestScore) {
      return 0; // User hasn't played yet
    }

    // Count how many scores are better than the user's best
    const scoresRef = collection(db, COLLECTIONS.GAME_SCORES);
    const q = query(
      scoresRef,
      where('gameId', '==', gameId),
      where('score', '>', userBestScore.score)
    );

    const querySnapshot = await getDocs(q);
    
    // Get unique user IDs with better scores
    const betterScoreUsers = new Set<string>();
    querySnapshot.forEach(doc => {
      betterScoreUsers.add(doc.data().userId);
    });

    return betterScoreUsers.size + 1; // +1 because rank starts at 1
  },

  // Get all scores for a user across all games
  async getUserScores(userId: string, limitCount: number = 50): Promise<GameScore[]> {
    const scoresRef = collection(db, COLLECTIONS.GAME_SCORES);
    const q = query(
      scoresRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const scores: GameScore[] = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      scores.push({
        id: doc.id,
        ...convertTimestamps(data),
      } as GameScore);
    });

    return scores;
  },

  // Get game statistics (total plays, average score, etc.)
  async getGameStats(gameId: string): Promise<{
    totalPlays: number;
    uniquePlayers: number;
    averageScore: number;
    highestScore: number;
  }> {
    const scoresRef = collection(db, COLLECTIONS.GAME_SCORES);
    const q = query(scoresRef, where('gameId', '==', gameId));

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return {
        totalPlays: 0,
        uniquePlayers: 0,
        averageScore: 0,
        highestScore: 0,
      };
    }

    let totalScore = 0;
    let highestScore = 0;
    const uniquePlayers = new Set<string>();

    querySnapshot.forEach(doc => {
      const data = doc.data();
      totalScore += data.score || 0;
      highestScore = Math.max(highestScore, data.score || 0);
      uniquePlayers.add(data.userId);
    });

    return {
      totalPlays: querySnapshot.size,
      uniquePlayers: uniquePlayers.size,
      averageScore: Math.round(totalScore / querySnapshot.size),
      highestScore,
    };
  },
};
