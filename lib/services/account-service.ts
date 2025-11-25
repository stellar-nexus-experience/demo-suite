import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  increment,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { v4 as uuidv4 } from 'uuid';
import { UserAccount } from '@/utils/types/account';
import { REFERRAL_REWARDS } from '../../utils/constants/referral/constants';
import { getBadgeById } from '../firebase/firebase-types';
// Removed unused service imports

export class AccountService {
  private static instance: AccountService;

  public static getInstance(): AccountService {
    if (!AccountService.instance) {
      AccountService.instance = new AccountService();
    }
    return AccountService.instance;
  }

  // Create new account - matches the structure used in firebase-service.ts
  async createAccount(
  walletAddress: string,
  publicKey: string,
  network: string,
  pendingReferralCode?: string | null
): Promise<any> {
  // Use wallet address as account ID (matches Firebase example structure)
  const accountId = walletAddress;

  const now = Timestamp.now();

  // ===============================================
  // 🎯 PASO CRUCIAL: Generar el código de referido
  // Últimos 8 caracteres del walletAddress, en mayúsculas.
  const referralCode = walletAddress.slice(-8).toUpperCase(); 
  // ===============================================

  // Match the exact structure from firebase-service.ts and Firebase example
  const newAccount = {
    id: accountId,
    displayName: 'Anonymous User', // Default display name
    walletAddress,
    network: network.toUpperCase(), // Match "TESTNET" format from example
    level: 1,
    experience: 0,
    totalPoints: 0,
    
    // 👇 CAMPO NUEVO AÑADIDO (referralCode) 👇
    referralCode: referralCode,
    // 👆 CAMPO NUEVO AÑADIDO (referralCode) 👆
    
    demosCompleted: [],
    badgesEarned: [],
    clappedDemos: [],
    completedQuests: [],
    questProgress: {},
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
    stats: {
      totalPoints: 0, // Will be updated when badges are earned
      lastActiveDate: new Date().toISOString().split('T')[0],
    },
  };

  await setDoc(doc(db, 'accounts', accountId), newAccount);

  // Apply referral code if provided (from URL parameter or other source)
  if (pendingReferralCode) {
    try {
      const { validateReferralCode } = await import('./referral-service');
      const validation = await validateReferralCode(walletAddress, pendingReferralCode);
      
      if (validation.applied && validation.referrerWalletAddress && validation.referrerAccount) {
        const { applyReferralCodeForExistingUser } = await import('./referral-service');
        await applyReferralCodeForExistingUser(walletAddress, pendingReferralCode);
      }
    } catch (error) {
      // Silently fail - account is created, referral just didn't apply
      console.warn('Failed to apply referral code during account creation:', error);
    }
  }

  // Points tracking is done in the account document itself (no separate pointsTransactions collection)

  return newAccount;
}

  // Get account by wallet address
  async getAccountByWallet(walletAddress: string): Promise<UserAccount | null> {
    const accountsRef = collection(db, 'accounts');
    const q = query(accountsRef, where('walletAddress', '==', walletAddress));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    return querySnapshot.docs[0].data() as UserAccount;
  }

  // Get account by ID
  async getAccountById(accountId: string): Promise<UserAccount | null> {
    const docRef = doc(db, 'accounts', accountId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return docSnap.data() as UserAccount;
  }


  async getAccountByReferralCode(referralCode: string): Promise<UserAccount | null> {
    
    
    const accountsRef = collection(db, 'accounts');
    
    // Crea la consulta para buscar el código en el campo 'referralCode'
    const q = query(
      accountsRef, 
      where('referralCode', '==', referralCode), 
      limit(1) 
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Devuelve la primera cuenta encontrada.
    const accountDoc = querySnapshot.docs[0];
    

    return { 
     
      walletAddress: accountDoc.id, 
      
      ...accountDoc.data() 
    } as UserAccount; 
  }

  // Update account
  async updateAccount(accountId: string, updates: Partial<UserAccount>): Promise<void> {
    const accountRef = doc(db, 'accounts', accountId);
    await updateDoc(accountRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  async incrementReferralStats(walletAddress: string): Promise<void> {
  // Asegúrate de importar doc, updateDoc, increment, serverTimestamp y REFERRAL_REWARDS.
  const accountRef = doc(db, 'accounts', walletAddress);

  // Usamos las constantes de recompensa del referidor
  const referrerPoints = REFERRAL_REWARDS.REFERRER_POINTS;

  await updateDoc(accountRef, {
    // Nuevos campos en el esquema:
    referralsCount: increment(1), // Suma 1 al contador
    totalReferralPoints: increment(referrerPoints), // Suma los puntos ganados
    updatedAt: serverTimestamp(),
  });
}

  // Update last login
  async updateLastLogin(accountId: string): Promise<void> {
    const accountRef = doc(db, 'accounts', accountId);
    await updateDoc(accountRef, {
      lastLoginAt: serverTimestamp(),
      'stats.lastActiveDate': new Date().toISOString().split('T')[0],
    });
  }

  // Start demo
  async startDemo(accountId: string, demoId: string): Promise<void> {
    const accountRef = doc(db, 'accounts', accountId);
    await updateDoc(accountRef, {
      [`demos.${demoId}.status`]: 'in_progress',
      [`demos.${demoId}.lastAttemptedAt`]: serverTimestamp(),
      [`demos.${demoId}.attempts`]: increment(1),
      updatedAt: serverTimestamp(),
    });
  }

  // Complete demo
  async completeDemo(accountId: string, demoId: string, score: number): Promise<void> {
    // Get current account state to check if this is first completion
    const accountDoc = await getDoc(doc(db, 'accounts', accountId));
    const account = accountDoc.data() as UserAccount;

    const currentDemo = account.demos[demoId as keyof typeof account.demos];
    const isFirstCompletion = currentDemo?.status !== 'completed';

    const pointsEarned = this.calculateDemoPoints(demoId, score, isFirstCompletion);
    
    // Calculate new experience and level
    const currentExperience = account.profile?.experience || account.experience || 0;
    const experienceGained = pointsEarned * 2; // Experience is 2x points
    const newExperience = currentExperience + experienceGained;
    const newLevel = Math.floor(newExperience / 1000) + 1;

    const updateData: any = {
      [`demos.${demoId}.status`]: 'completed',
      [`demos.${demoId}.completedAt`]: serverTimestamp(),
      [`demos.${demoId}.score`]: score,
      [`demos.${demoId}.pointsEarned`]: isFirstCompletion ? pointsEarned : currentDemo.pointsEarned, // Keep original points on replay
      'profile.totalPoints': increment(pointsEarned),
      'profile.experience': increment(experienceGained),
      'profile.level': newLevel, // Update level in profile
      level: newLevel, // Update level at root for backward compatibility
      experience: newExperience, // Update experience at root for backward compatibility
      totalPoints: increment(pointsEarned), // Update totalPoints at root for backward compatibility
      'stats.totalPointsEarned': increment(pointsEarned),
      updatedAt: serverTimestamp(),
    };

    // Only increment completed demos count on first completion
    if (isFirstCompletion) {
      updateData['stats.totalDemosCompleted'] = increment(1);
    }

    const accountRef = doc(db, 'accounts', accountId);
    await updateDoc(accountRef, updateData);

    // Points tracking is done in the account document itself (no separate pointsTransactions collection)

    // Demo progress is tracked separately by markDemoComplete to avoid duplicates

    // Only check for badge rewards on first completion
    if (isFirstCompletion) {
      await this.checkAndAwardBadges(accountId, demoId, score);
      // Unlock next demo if applicable
      await this.unlockNextDemo(accountId, demoId);
    }
  }

  // Get demo name by demo ID
  private getDemoName(demoId: string): string {
    const demoNames: Record<string, string> = {
      'hello-milestone': 'Baby Steps to Riches',
      'milestone-voting': 'Democracy in Action',
      'dispute-resolution': 'Drama Queen Escrow',
      'micro-marketplace': 'Gig Economy Madness',
      demo1: 'Baby Steps to Riches',
      demo2: 'Democracy in Action',
      demo3: 'Drama Queen Escrow',
      demo4: 'Gig Economy Madness',
    };
    return demoNames[demoId] || 'Unknown Demo';
  }

  // Calculate demo points based on demo and score
  private calculateDemoPoints(
    demoId: string,
    score: number,
    isFirstCompletion: boolean = true
  ): number {
    const basePoints = {
      demo1: 100,
      'hello-milestone': 100,
      demo2: 150,
      'milestone-voting': 150,
      demo3: 200,
      'dispute-resolution': 200,
      demo4: 250,
      'micro-marketplace': 250,
    };

    const base = basePoints[demoId as keyof typeof basePoints] || 100;
    const scoreMultiplier = Math.max(0.5, score / 100); // Minimum 50% points

    let points = Math.round(base * scoreMultiplier);

    // Give reduced points for replays (25% of original)
    if (!isFirstCompletion) {
      points = Math.round(points * 0.25);
    }

    return points;
  }

  // Award badge
  async awardBadge(accountId: string, badgeId: string): Promise<void> {
    const badge = getBadgeById(badgeId);
    const badgePoints = badge?.earningPoints || 0;
    
    // Get current account to calculate new level
    const accountDoc = await getDoc(doc(db, 'accounts', accountId));
    const account = accountDoc.data() as UserAccount;
    
    // Calculate new experience and level (badges give points but experience is 2x points)
    const currentExperience = account.profile?.experience || account.experience || 0;
    const experienceGained = badgePoints * 2; // Experience is 2x points
    const newExperience = currentExperience + experienceGained;
    const newLevel = Math.floor(newExperience / 1000) + 1;
    
    const accountRef = doc(db, 'accounts', accountId);
    await updateDoc(accountRef, {
      badgesEarned: arrayUnion(badgeId), // Add to badges array
      'profile.totalPoints': increment(badgePoints),
      'profile.experience': increment(experienceGained),
      'profile.level': newLevel, // Update level in profile
      level: newLevel, // Update level at root for backward compatibility
      experience: newExperience, // Update experience at root for backward compatibility
      totalPoints: increment(badgePoints), // Update totalPoints at root for backward compatibility
      updatedAt: serverTimestamp(),
    });

    // Points tracking is done in the account document itself (no separate pointsTransactions collection)
  }

  // Check and award badges based on demo completion order
  private async checkAndAwardBadges(
    accountId: string,
    demoId: string,
    score: number
  ): Promise<void> {
    // Get the account to check current state
    const accountDoc = await getDoc(doc(db, 'accounts', accountId));
    const account = accountDoc.data() as UserAccount;
    const earnedBadgeNames = account.badges.map(b => b.name);

    // Check specific demo completions for badge awarding
    const completedDemos = this.getCompletedDemos(account);

    // Award badges based on specific demo completions
    await this.awardDemoBadge(accountId, demoId, earnedBadgeNames);

    // Note: Nexus Master badge is now claimed manually by user action, not automatically
  }

  // Award badge for specific demo completion
  private async awardDemoBadge(
    accountId: string,
    demoId: string,
    earnedBadgeNames: string[]
  ): Promise<void> {
    let badgeId: string | null = null;

    // Map demo IDs to badge IDs based on current demo configuration:
    // Demo 1 (Baby Steps to Riches) → Escrow Expert
    // Demo 2 (Drama Queen Escrow) → Trust Guardian
    // Demo 3 (Gig Economy Madness) → Stellar Champion
    switch (demoId) {
      case 'hello-milestone':
        badgeId = 'escrow-expert';
        break;
      case 'dispute-resolution':
        badgeId = 'trust-guardian';
        break;
      case 'micro-marketplace':
        badgeId = 'stellar-champion';
        break;
      // Legacy demo IDs (keeping for backward compatibility)
      case 'demo1':
        badgeId = 'escrow-expert';
        break;
      case 'demo3':
        badgeId = 'trust-guardian';
        break;
      case 'demo4':
        badgeId = 'stellar-champion';
        break;
    }

    if (!badgeId) {
      return;
    }

    const badgeConfig = getBadgeById(badgeId);

    if (!badgeConfig) {
      return;
    }

    // Check if badge is already earned
    if (earnedBadgeNames.includes(badgeConfig.name)) {
      return;
    }

    // Award the badge using badgeId
    await this.awardBadge(accountId, badgeConfig.id);
  }

  // Check if user deserves Nexus Master badge (completing demos 1, 3, and 4)
  private async checkNexusMasterBadge(
    accountId: string,
    earnedBadgeNames: string[]
  ): Promise<void> {
    const accountDoc = await getDoc(doc(db, 'accounts', accountId));
    const account = accountDoc.data() as UserAccount;

    // Check if all 3 main demos are completed (current configuration)
    const demo1Completed = account.demos['hello-milestone']?.status === 'completed';
    const demo2Completed = account.demos['dispute-resolution']?.status === 'completed';
    const demo3Completed = account.demos['micro-marketplace']?.status === 'completed';

    // Also check legacy demo IDs for backward compatibility
    const legacyDemo1Completed = account.demos.demo1?.status === 'completed';
    const legacyDemo3Completed = account.demos.demo3?.status === 'completed';
    const legacyDemo4Completed = account.demos.demo4?.status === 'completed';

    const hasRequiredDemos =
      (demo1Completed && demo2Completed && demo3Completed) ||
      (legacyDemo1Completed && legacyDemo3Completed && legacyDemo4Completed);

    if (hasRequiredDemos && !earnedBadgeNames.includes('Nexus Master')) {
      const nexusBadgeConfig = getBadgeById('nexus-master');
      if (nexusBadgeConfig) {
        await this.awardBadge(accountId, 'nexus-master');
      }
    }
  }

  // Helper method to get completed demos
  private getCompletedDemos(account: UserAccount): string[] {
    const completed: string[] = [];

    Object.entries(account.demos).forEach(([demoId, demo]) => {
      if (demo.status === 'completed') {
        completed.push(demoId);
      }
    });

    return completed;
  }

  // Check if user deserves Stellar Champion badge (all 4 demos completed + invite friend)
  private async checkStellarChampionBadge(accountId: string): Promise<void> {
    const accountDoc = await getDoc(doc(db, 'accounts', accountId));
    const account = accountDoc.data() as UserAccount;

    const earnedBadgeNames = account.badges.map(b => b.name);

    // Check if all 3 demos are completed
    const mainDemoProgress = this.getMainDemoCompletionCount(account);
    const allDemosCompleted = mainDemoProgress.completed === 3;

    // TODO: Add invite friend check when invite system is implemented
    const hasInvitedFriend = true; // For now, award when all demos are completed

    if (allDemosCompleted && hasInvitedFriend && !earnedBadgeNames.includes('Stellar Champion')) {
      const stellarBadgeConfig = getBadgeById('stellar-champion');
      if (stellarBadgeConfig) {
        await this.awardBadge(accountId, 'stellar-champion');
      }
    }
  }

  // Unlock next demo
  private async unlockNextDemo(accountId: string, completedDemoId: string): Promise<void> {
    const nextDemoMap: Record<string, string> = {
      demo1: 'demo2',
      demo2: 'demo3',
      demo3: 'demo4',
    };

    const nextDemo = nextDemoMap[completedDemoId];
    if (nextDemo) {
      const accountRef = doc(db, 'accounts', accountId);
      await updateDoc(accountRef, {
        [`demos.${nextDemo}.status`]: 'available',
        updatedAt: serverTimestamp(),
      });
    }
  }

  // Points transactions removed - all tracking is done in the account document itself

  // Leaderboard functionality removed - will be derived from accounts collection in the future

  // Update profile
  async updateProfile(
    accountId: string,
    profileUpdates: Partial<UserAccount['profile']>
  ): Promise<void> {
    const accountRef = doc(db, 'accounts', accountId);
    await updateDoc(accountRef, {
      profile: profileUpdates,
      updatedAt: serverTimestamp(),
    });
  }

  // Update settings
  async updateSettings(
    accountId: string,
    settingsUpdates: Partial<UserAccount['settings']>
  ): Promise<void> {
    const accountRef = doc(db, 'accounts', accountId);
    await updateDoc(accountRef, {
      settings: settingsUpdates,
      updatedAt: serverTimestamp(),
    });
  }

  // Add completed demo to demosCompleted array
  async addCompletedDemo(accountId: string, demoId: string): Promise<void> {
    const accountRef = doc(db, 'accounts', accountId);

    // Get current account to check existing demosCompleted
    const accountSnap = await getDoc(accountRef);
    if (!accountSnap.exists()) {
      throw new Error('Account not found');
    }

    const accountData = accountSnap.data();
    const currentDemosCompleted = accountData.demosCompleted || [];

    // Check if demo is already completed
    if (currentDemosCompleted.includes(demoId)) {
      return; // Already completed
    }

    // Add demo to completed list
    const updatedDemosCompleted = [...currentDemosCompleted, demoId];

    await updateDoc(accountRef, {
      demosCompleted: updatedDemosCompleted,
      updatedAt: serverTimestamp(),
    });
  }

  // Add earned badge to badgesEarned array
  async addEarnedBadge(accountId: string, badgeId: string): Promise<void> {
    const accountRef = doc(db, 'accounts', accountId);

    // Get current account to check existing badgesEarned
    const accountSnap = await getDoc(accountRef);
    if (!accountSnap.exists()) {
      throw new Error('Account not found');
    }

    const accountData = accountSnap.data();
    const currentBadgesEarned = accountData.badgesEarned || [];

    // Check if badge is already earned
    if (currentBadgesEarned.includes(badgeId)) {
      return; // Already earned
    }

    // Add badge to earned list
    const updatedBadgesEarned = [...currentBadgesEarned, badgeId];

    await updateDoc(accountRef, {
      badgesEarned: updatedBadgesEarned,
      updatedAt: serverTimestamp(),
    });
  }

  // Add experience and points to account
  async addExperienceAndPoints(
    accountId: string,
    experience: number,
    points: number
  ): Promise<void> {
    const accountRef = doc(db, 'accounts', accountId);

    // Get current account to check existing values
    const accountSnap = await getDoc(accountRef);
    if (!accountSnap.exists()) {
      throw new Error('Account not found');
    }

    const accountData = accountSnap.data();
    const currentExperience = accountData.experience || 0;
    const currentPoints = accountData.totalPoints || 0;

    // Calculate new level based on experience
    const newExperience = currentExperience + experience;
    const newLevel = Math.floor(newExperience / 1000) + 1;

    await updateDoc(accountRef, {
      experience: newExperience,
      totalPoints: currentPoints + points,
      level: newLevel, // Root level for backward compatibility
      'profile.level': newLevel, // Also update profile.level for consistency
      updatedAt: serverTimestamp(),
    });
  }

  // Get account by wallet address
  async getAccountByWalletAddress(walletAddress: string): Promise<any> {
    const accountRef = doc(db, 'accounts', walletAddress);
    const accountSnap = await getDoc(accountRef);

    if (!accountSnap.exists()) {
      return null;
    }

    return {
      id: accountSnap.id,
      ...accountSnap.data(),
    };
  }

  // Get main demo completion count (only the 3 available demos)
  getMainDemoCompletionCount(account: UserAccount): { completed: number; total: number } {
    const mainDemos = ['hello-milestone', 'dispute-resolution', 'micro-marketplace'];

    const completedCount = mainDemos.filter(
      demoId => account.demos[demoId as keyof typeof account.demos]?.status === 'completed'
    ).length;

    return {
      completed: completedCount,
      total: 3,
    };
  }
}

// Export singleton instance
export const accountService = AccountService.getInstance();