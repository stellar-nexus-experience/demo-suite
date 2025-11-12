import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  Timestamp,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

export type NotificationType = 
  | 'challenge_received' 
  | 'challenge_accepted' 
  | 'challenge_completed' 
  | 'challenge_won' 
  | 'challenge_lost'
  | 'challenge_expired'
  | 'demo_completed' // ✅ NUEVO
  | 'quest_completed'; // ✅ NUEVO

export interface Notification {
  id: string;
  userId: string; // Recipient
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
  data?: {
    challengeId?: string;
    fromUserId?: string;
    fromUsername?: string;
    pointsAmount?: number;
    gameId?: string;
    //CAMPOS PARA DEMOS/MISSIONS/REWARDS ✅
    xpEarned?: number;
    pointsEarned?: number;
    badgeId?: string;
    demoName?: string;
    questName?: string;
    badgeName?: string; 
    
    [key: string]: any;
  };
}
    

class NotificationService {
  private notificationsCollection = 'notifications';

  /**
   * Create a new notification
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Notification['data']
  ): Promise<string> {
    try {
      const notificationData = {
        userId,
        type,
        title,
        message,
        read: false,
        createdAt: Timestamp.now(),
        data: data || {},
      };

      const docRef = await addDoc(
        collection(db, this.notificationsCollection),
        notificationData
      );

      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Subscribe to user notifications
   */
  subscribeToUserNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void,
    limitCount: number = 50
  ): () => void {
    const q = query(
      collection(db, this.notificationsCollection),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications: Notification[] = [];
      snapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
        } as Notification);
      });
      callback(notifications);
    });

    return unsubscribe;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, this.notificationsCollection, notificationId);
      await updateDoc(notificationRef, {
        read: true,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.notificationsCollection),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const updatePromises = snapshot.docs.map((document) =>
        updateDoc(doc(db, this.notificationsCollection, document.id), {
          read: true,
        })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, this.notificationsCollection),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Create challenge notification
   */
  async notifyChallengeReceived(
    targetUserId: string,
    fromUserId: string,
    fromUsername: string,
    challengeId: string,
    description: string,
    pointsReward: number,
    gameId: string
  ): Promise<string> {
    return this.createNotification(
      targetUserId,
      'challenge_received',
      '🎯 New Challenge!',
      `${fromUsername} challenged you: ${description}`,
      {
        challengeId,
        fromUserId,
        fromUsername,
        pointsAmount: pointsReward,
        gameId,
      }
    );
  }

  /**
   * Notify challenge accepted
   */
  async notifyChallengeAccepted(
    challengerUserId: string,
    acceptedByUserId: string,
    acceptedByUsername: string,
    challengeId: string,
    description: string
  ): Promise<string> {
    return this.createNotification(
      challengerUserId,
      'challenge_accepted',
      '✅ Challenge Accepted!',
      `${acceptedByUsername} accepted your challenge: ${description}`,
      {
        challengeId,
        fromUserId: acceptedByUserId,
        fromUsername: acceptedByUsername,
      }
    );
  }

  /**
   * Notify challenge completed
   */
  async notifyChallengeCompleted(
    challengerUserId: string,
    completedByUserId: string,
    completedByUsername: string,
    challengeId: string,
    description: string
  ): Promise<string> {
    return this.createNotification(
      challengerUserId,
      'challenge_completed',
      '🏁 Challenge Completed!',
      `${completedByUsername} completed your challenge: ${description}`,
      {
        challengeId,
        fromUserId: completedByUserId,
        fromUsername: completedByUsername,
      }
    );
  }

  /**
   * Notify challenge won
   */
  async notifyChallengeWon(
    winnerUserId: string,
    pointsWon: number,
    challengeId: string,
    description: string
  ): Promise<string> {
    return this.createNotification(
      winnerUserId,
      'challenge_won',
      '🎉 Challenge Won!',
      `You won ${pointsWon} points by completing: ${description}`,
      {
        challengeId,
        pointsAmount: pointsWon,
      }
    );
  }

  /**
   * Notify challenge lost
   */
  async notifyChallengeLost(
    loserUserId: string,
    pointsLost: number,
    challengeId: string,
    description: string
  ): Promise<string> {
    return this.createNotification(
      loserUserId,
      'challenge_lost',
      '😔 Challenge Not Completed',
      `You lost ${pointsLost} points. Challenge expired: ${description}`,
      {
        challengeId,
        pointsAmount: pointsLost,
      }
    );
  }

  /**
   * Notify challenge expired
   */
  async notifyChallengeExpired(
    userId: string,
    challengeId: string,
    description: string,
    isChallenger: boolean
  ): Promise<string> {
    if (isChallenger) {
      return this.createNotification(
        userId,
        'challenge_expired',
        '⏰ Challenge Expired',
        `Your challenge expired and was not accepted: ${description}`,
        { challengeId }
      );
    } else {
      return this.createNotification(
        userId,
        'challenge_expired',
        '⏰ Challenge Expired',
        `The challenge expired before completion: ${description}`,
        { challengeId }
      );
    }
  }

  

  /**
   * Notify demo completed
   */
  async notifyDemoCompleted(
    userId: string,
    demoId: string,
    demoName: string,
    xpEarned: number,
    pointsEarned: number,
    badgeName?: string
  ): Promise<string | null> {
    try {
      const badgeText = badgeName ? ` and unlocked the ${badgeName} badge` : '';
      const message = `You completed the '${demoName}' demo! You earned ${xpEarned} XP and ${pointsEarned} points${badgeText}.`;

      return this.createNotification(
        userId,
        'demo_completed',
        '🏆 ¡Demo Completed!',
        message,
        {
          demoId,
          xpEarned,
          pointsEarned,
          badgeName,
          demoName,
        }
      );
    } catch (error) {
      console.error('Error en notifyDemoCompleted:', error);
      return null;
    }
  }

  /**
   * Notify quest completed
   */
  async notifyQuestCompleted(
    userId: string,
    questId: string,
    questName: string,
    xpEarned: number,
    pointsEarned: number,
    badgeName?: string
  ): Promise<string | null> {
    try {
      const badgemessage = badgeName ?  `and unlocked the ${badgeName} badge` : '';
      const message = `You completed the mission: ${questName}! You earned ${xpEarned} XP and ${pointsEarned} points${badgemessage}.`;

      return this.createNotification(
        userId,
        'quest_completed',
        '✅🫡¡Misión Completed!',
        message,
        {
          questId,
          xpEarned,
          pointsEarned,
          badgeName,
          questName,
        }
      );
    } catch (error) {
      console.error('Error en notifyQuestCompleted:', error);
      return null;
    }
  }
} 

export const notificationService = new NotificationService();