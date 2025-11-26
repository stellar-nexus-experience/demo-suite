import {
  Quest,
  Account,
  getQuestById,
  getAvailableQuests,
  getAllQuests,
  PREDEFINED_QUESTS,
} from '@/lib/firebase/firebase-types';
import { db } from '@/lib/firebase/firebase';
import { doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';

// ✅ AÑADIDO: Importar notificationService
import { notificationService } from '@/lib/services/notification-service';
import { getBadgeById } from '@/lib/firebase/firebase-types';

export class QuestService {
  /**
   * Get all available quests for a user based on their completed badges
   */
  static getAvailableQuests(account: Account): Quest[] {
    // Handle both array and object formats for badgesEarned
    let badgesEarnedArray: string[] = [];
    if (Array.isArray(account.badgesEarned)) {
      badgesEarnedArray = account.badgesEarned;
    } else if (account.badgesEarned && typeof account.badgesEarned === 'object') {
      badgesEarnedArray = Object.values(account.badgesEarned);
    }

    return getAvailableQuests(badgesEarnedArray);
  }

  /**
   * Get completed quests for a user
   */
  static getCompletedQuests(account: Account): string[] {
    // Handle both array and object formats for completedQuests
    let completedQuests: string[] = [];
    if (Array.isArray(account.completedQuests)) {
      completedQuests = account.completedQuests;
    } else if (account.completedQuests && typeof account.completedQuests === 'object') {
      completedQuests = Object.values(account.completedQuests);
    }

    // Also include quests where the user has earned the badge (even if not explicitly marked as completed)
    const badgesEarned = this.getBadgesEarned(account);
    const allQuests = getAllQuests();

    for (const quest of allQuests) {
      if (quest.rewards.badgeId && badgesEarned.includes(quest.rewards.badgeId)) {
        if (!completedQuests.includes(quest.id)) {
          completedQuests.push(quest.id);
        }
      }
    }

    return completedQuests;
  }

  /**
   * Check if a quest is completed by the user
   */
  static isQuestCompleted(account: Account, questId: string): boolean {
    const completedQuests = this.getCompletedQuests(account);
    const isInCompletedQuests = completedQuests.includes(questId);

    // Also check if the quest rewards a badge and the user has earned that badge
    const quest = getQuestById(questId);
    if (quest?.rewards.badgeId) {
      const badgesEarned = this.getBadgesEarned(account);
      const hasBadge = badgesEarned.includes(quest.rewards.badgeId);

      // Quest is completed if it's in completedQuests OR if the user has the badge
      return isInCompletedQuests || hasBadge;
    }

    return isInCompletedQuests;
  }

  /**
   * Get badges earned by the user
   */
  static getBadgesEarned(account: Account): string[] {
    // Handle both array and object formats for badgesEarned
    if (Array.isArray(account.badgesEarned)) {
      return account.badgesEarned;
    } else if (account.badgesEarned && typeof account.badgesEarned === 'object') {
      return Object.values(account.badgesEarned);
    }
    return [];
  }

  /**
   * Get quest progress for multi-step quests
   */
  static getQuestProgress(account: Account, questId: string): number {
    return account.questProgress?.[questId] || 0;
  }

  /**
   * Complete a quest manually (for social media tasks)
   */
  static async completeQuest(
    account: Account,
    questId: string,
    verificationData?: any
  ): Promise<{ success: boolean; message: string; rewards?: any }> {
    try {
      const quest = getQuestById(questId);
      if (!quest) {
        return { success: false, message: 'Quest not found' };
      }

      // Check if quest is already completed
      if (this.isQuestCompleted(account, questId)) {
        return { success: false, message: 'Quest already completed' };
      }

      // Check if quest is available for this user
      const availableQuests = this.getAvailableQuests(account);
      if (!availableQuests.find(q => q.id === questId)) {
        return { success: false, message: 'Quest not available' };
      }

      // Update account with completed quest and rewards
      const accountRef = doc(db, 'accounts', account.id);

      const updateData: any = {
        completedQuests: arrayUnion(questId),
        experience: increment(quest.rewards.experience),
        totalPoints: increment(quest.rewards.points),
        updatedAt: new Date(),
      };

      let badgeName = '';

      // Add badge if quest rewards one
      if (quest.rewards.badgeId) {
        updateData.badgesEarned = arrayUnion(quest.rewards.badgeId);
      }

      await updateDoc(accountRef, updateData);

      //🎯 INTEGRACIÓN DE NOTIFICACIÓN DE MISIÓN 🎯// 👀
      try {
        await notificationService.notifyQuestCompleted(
          account.id,
          questId,
          quest.title, // Nombre de la misión
          quest.rewards.experience,
          quest.rewards.points,
          badgeName // Nombre legible de la insignia (puede ser '')
        );
      } catch (notificationError) {
        // No interrumpir el flujo principal si la notificación falla🚫
        console.error('QuestService: Failed to send quest notification:', notificationError);
      }

      return {
        success: true,
        message: `Quest "${quest.title}" completed! Earned ${quest.rewards.experience} XP and ${quest.rewards.points} points.`,
        rewards: quest.rewards,
      };
    } catch (error) {
      console.error('Error completing quest:', error);
      return { success: false, message: 'Failed to complete quest' };
    }
  }

  /**
   * Update quest progress for multi-step quests
   */
  static async updateQuestProgress(
    account: Account,
    questId: string,
    progress: number
  ): Promise<{ success: boolean; message: string; completed?: boolean }> {
    try {
      const quest = getQuestById(questId);
      if (!quest) {
        return { success: false, message: 'Quest not found' };
      }

      // Check if quest is already completed
      if (this.isQuestCompleted(account, questId)) {
        return { success: false, message: 'Quest already completed' };
      }

      const accountRef = doc(db, 'accounts', account.id);

      // Update progress
      await updateDoc(accountRef, {
        [`questProgress.${questId}`]: progress,
        updatedAt: new Date(),
      });

      // Check if quest is now completed
      const requiredCount = quest.requirements.count || 1;
      if (progress >= requiredCount) {
        // Complete the quest
        const result = await this.completeQuest(account, questId);
        return {
          success: true,
          message: `Quest progress updated. ${result.message}`,
          completed: true,
        };
      }

      return {
        success: true,
        message: `Quest progress updated: ${progress}/${requiredCount}`,
        completed: false,
      };
    } catch (error) {
      console.error('Error updating quest progress:', error);
      return { success: false, message: 'Failed to update quest progress' };
    }
  }

  /**
   * Get quest statistics for a user
   */
  static getQuestStats(account: Account): {
    totalQuests: number;
    completedQuests: number;
    availableQuests: number;
    totalXPEarned: number;
    totalPointsEarned: number;
  } {
    const availableQuests = this.getAvailableQuests(account);
    const completedQuests = this.getCompletedQuests(account);

    let totalXPEarned = 0;
    let totalPointsEarned = 0;

    completedQuests.forEach(questId => {
      const quest = getQuestById(questId);
      if (quest) {
        totalXPEarned += quest.rewards.experience;
        totalPointsEarned += quest.rewards.points;
      }
    });

    return {
      totalQuests: PREDEFINED_QUESTS.length,
      completedQuests: completedQuests.length,
      availableQuests: availableQuests.length,
      totalXPEarned,
      totalPointsEarned,
    };
  }

  /**
   * Get quests by category
   */
  static getQuestsByCategory(account: Account, category: string): Quest[] {
    const availableQuests = this.getAvailableQuests(account);
    return availableQuests.filter(quest => quest.category === category);
  }

  /**
   * Check if user has unlocked quest system (completed top 5 badges)
   */
  static isQuestSystemUnlocked(account: Account): boolean {
    const requiredBadges = [
      'welcome_explorer',
      'escrow_expert',
      'trust_guardian',
      'stellar_champion',
      'nexus_master',
    ];

    // Handle both array and object formats for badgesEarned
    let badgesEarnedArray: string[] = [];
    if (Array.isArray(account.badgesEarned)) {
      badgesEarnedArray = account.badgesEarned;
    } else if (account.badgesEarned && typeof account.badgesEarned === 'object') {
      badgesEarnedArray = Object.values(account.badgesEarned);
    }

    return requiredBadges.every(badgeId => badgesEarnedArray.includes(badgeId));
  }
}
