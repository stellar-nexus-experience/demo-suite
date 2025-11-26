import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

// Types
export interface GameMessage {
  id: string;
  gameId: string;
  userId: string;
  username: string;
  message: string;
  type: 'chat' | 'achievement' | 'challenge';
  createdAt: Timestamp;
}

export type ChallengeTimeLimit = 'today' | 'this_week' | 'this_month';

export interface Challenge {
  id: string;
  gameId: string;
  challengerId: string;
  challengerName: string;
  targetUserId?: string; // If undefined, open to anyone
  targetUsername?: string;
  description: string;
  requirement: string; // e.g., "Reach 3000 points"
  requiredScore?: number;
  pointsReward: number;
  pointsStaked: number; // Points locked from challenger
  status: 'open' | 'accepted' | 'completed' | 'expired';
  timeLimit: ChallengeTimeLimit;
  acceptedBy?: string;
  acceptedByName?: string;
  completedBy?: string;
  winnerId?: string; // User who won the challenge
  loserId?: string; // User who lost the challenge
  createdAt: Timestamp;
  expiresAt: Timestamp;
  completedAt?: Timestamp;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
}

const MESSAGES_COLLECTION = 'gameMessages';
const CHALLENGES_COLLECTION = 'gameChallenges';
const DIRECT_MESSAGES_COLLECTION = 'directMessages';
const MAX_MESSAGES_PER_GAME = 50;

class GameSocialService {
  // ============ UTILITY METHODS ============

  /**
   * Calculate expiration date based on time limit
   */
  private getExpirationDate(timeLimit: ChallengeTimeLimit): Timestamp {
    const now = new Date();
    let expiresAt: Date;

    switch (timeLimit) {
      case 'today':
        expiresAt = new Date(now);
        expiresAt.setHours(23, 59, 59, 999); // End of today
        break;
      case 'this_week':
        expiresAt = new Date(now);
        const daysUntilSunday = 7 - now.getDay(); // Days until end of week (Sunday)
        expiresAt.setDate(now.getDate() + daysUntilSunday);
        expiresAt.setHours(23, 59, 59, 999);
        break;
      case 'this_month':
        expiresAt = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
        expiresAt.setHours(23, 59, 59, 999);
        break;
      default:
        expiresAt = new Date(now);
        expiresAt.setHours(23, 59, 59, 999);
    }

    return Timestamp.fromDate(expiresAt);
  }

  /**
   * Search users by username (for @ mentions)
   */
  async searchUsers(
    searchQuery: string,
    maxResults: number = 10
  ): Promise<
    Array<{
      id: string;
      username: string;
      displayName: string;
      walletAddress: string;
      level: number;
      points: number;
    }>
  > {
    try {
      const normalizedQuery = searchQuery.toLowerCase().trim();

      // Query users where username starts with the search query
      const usersQuery = query(
        collection(db, 'accounts'),
        orderBy('profile.username'),
        limit(maxResults * 2) // Get more to filter client-side
      );

      const snapshot = await getDocs(usersQuery);
      const users = snapshot.docs
        .map(doc => {
          const data = doc.data();
          const username = data.profile?.username || '';
          const displayName = data.profile?.displayName || username || 'Anonymous';

          return {
            id: doc.id,
            username,
            displayName,
            walletAddress: data.walletAddress || '',
            level: data.profile?.level || 1,
            points: data.totalPoints || 0,
          };
        })
        .filter(
          user =>
            user.username.toLowerCase().includes(normalizedQuery) ||
            user.displayName.toLowerCase().includes(normalizedQuery) ||
            user.walletAddress.toLowerCase().includes(normalizedQuery)
        )
        .slice(0, maxResults);

      return users;
    } catch (error) {
      return [];
    }
  }

  // ============ GAME CHAT ============

  async sendGameMessage(
    gameId: string,
    userId: string,
    username: string,
    message: string,
    type: GameMessage['type'] = 'chat'
  ) {
    try {
      const messageData = {
        gameId,
        userId,
        username,
        message,
        type,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, MESSAGES_COLLECTION), messageData);

      // Clean old messages if limit exceeded
      await this.cleanOldMessages(gameId);

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  async getGameMessages(gameId: string, maxMessages: number = 50) {
    try {
      const q = query(
        collection(db, MESSAGES_COLLECTION),
        where('gameId', '==', gameId),
        orderBy('createdAt', 'desc'),
        limit(maxMessages)
      );

      const snapshot = await getDocs(q);
      const messages: GameMessage[] = snapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as GameMessage
      );

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      return [];
    }
  }

  subscribeToGameMessages(
    gameId: string,
    callback: (messages: GameMessage[]) => void,
    maxMessages: number = 50
  ) {
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('gameId', '==', gameId),
      orderBy('createdAt', 'desc'),
      limit(maxMessages)
    );

    return onSnapshot(q, snapshot => {
      const messages: GameMessage[] = snapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as GameMessage
      );

      callback(messages.reverse());
    });
  }

  private async cleanOldMessages(gameId: string) {
    try {
      const q = query(
        collection(db, MESSAGES_COLLECTION),
        where('gameId', '==', gameId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);

      if (snapshot.size > MAX_MESSAGES_PER_GAME) {
        // Delete oldest messages
        const messagesToDelete = snapshot.docs.slice(MAX_MESSAGES_PER_GAME);

        await Promise.all(messagesToDelete.map(doc => deleteDoc(doc.ref)));
      }
    } catch (error) {
      // Error cleaning old messages
    }
  }

  // ============ CHALLENGES ============

  async createChallenge(
    gameId: string,
    challengerId: string,
    challengerName: string,
    description: string,
    requirement: string,
    pointsReward: number,
    timeLimit: ChallengeTimeLimit,
    targetUserId?: string,
    targetUsername?: string,
    requiredScore?: number
  ) {
    try {
      const expiresAt = this.getExpirationDate(timeLimit);

      const challengeData = {
        gameId,
        challengerId,
        challengerName,
        targetUserId,
        targetUsername,
        description,
        requirement,
        requiredScore,
        pointsReward,
        pointsStaked: pointsReward, // Points are staked and locked
        status: 'open' as const,
        timeLimit,
        createdAt: serverTimestamp(),
        expiresAt,
      };

      const docRef = await addDoc(collection(db, CHALLENGES_COLLECTION), challengeData);

      return { success: true, id: docRef.id };
    } catch (error) {
      throw error;
    }
  }

  async getOpenChallenges(gameId: string) {
    try {
      const q = query(
        collection(db, CHALLENGES_COLLECTION),
        where('gameId', '==', gameId),
        where('status', '==', 'open'),
        orderBy('createdAt', 'desc'),
        limit(30)
      );

      const snapshot = await getDocs(q);
      const challenges: Challenge[] = snapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Challenge
      );

      return challenges;
    } catch (error) {
      return [];
    }
  }

  subscribeToOpenChallenges(gameId: string, callback: (challenges: Challenge[]) => void) {
    const q = query(
      collection(db, CHALLENGES_COLLECTION),
      where('gameId', '==', gameId),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc'),
      limit(30)
    );

    return onSnapshot(q, snapshot => {
      const challenges: Challenge[] = snapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Challenge
      );

      callback(challenges);
    });
  }

  async acceptChallenge(challengeId: string, userId: string, username: string) {
    try {
      const challengeRef = doc(db, CHALLENGES_COLLECTION, challengeId);

      await updateDoc(challengeRef, {
        status: 'accepted',
        acceptedBy: userId,
        acceptedByName: username,
      });

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  async completeChallenge(challengeId: string, userId: string) {
    try {
      const challengeRef = doc(db, CHALLENGES_COLLECTION, challengeId);
      const challengeDoc = await getDoc(challengeRef);

      if (!challengeDoc.exists()) {
        throw new Error('Challenge not found');
      }

      const challenge = challengeDoc.data() as Challenge;

      // Transfer points from challenger to completer
      // This should be done through a Cloud Function for security
      // For now, just mark as completed

      await updateDoc(challengeRef, {
        status: 'completed',
        completedBy: userId,
        completedAt: serverTimestamp(),
      });

      return { success: true, pointsReward: challenge.pointsReward };
    } catch (error) {
      throw error;
    }
  }

  async deleteChallenge(challengeId: string, userId: string) {
    try {
      const challengeRef = doc(db, CHALLENGES_COLLECTION, challengeId);
      const challengeDoc = await getDoc(challengeRef);

      if (!challengeDoc.exists()) {
        throw new Error('Challenge not found');
      }

      const challenge = challengeDoc.data() as Challenge;

      // Only challenger can delete their own challenge
      if (challenge.challengerId !== userId) {
        throw new Error('Unauthorized to delete this challenge');
      }

      await deleteDoc(challengeRef);

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // ============ DIRECT MESSAGES ============

  async sendDirectMessage(
    senderId: string,
    senderName: string,
    recipientId: string,
    recipientName: string,
    message: string
  ) {
    try {
      const messageData = {
        senderId,
        senderName,
        recipientId,
        recipientName,
        message,
        read: false,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, DIRECT_MESSAGES_COLLECTION), messageData);

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  async getDirectMessages(userId: string) {
    try {
      // Get messages where user is sender or recipient
      const sentQuery = query(
        collection(db, DIRECT_MESSAGES_COLLECTION),
        where('senderId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const receivedQuery = query(
        collection(db, DIRECT_MESSAGES_COLLECTION),
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentQuery),
        getDocs(receivedQuery),
      ]);

      const sentMessages = sentSnapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as DirectMessage
      );

      const receivedMessages = receivedSnapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as DirectMessage
      );

      // Combine and sort by date
      const allMessages = [...sentMessages, ...receivedMessages].sort(
        (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
      );

      return allMessages;
    } catch (error) {
      return [];
    }
  }

  async markMessageAsRead(messageId: string) {
    try {
      const messageRef = doc(db, DIRECT_MESSAGES_COLLECTION, messageId);
      await updateDoc(messageRef, { read: true });
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // ============ USERS LIST ============

  async getActiveUsers(maxUsers: number = 20) {
    try {
      // Get recently active users from account service
      // This is a simplified version - you might want to add a lastActive field
      const usersQuery = query(
        collection(db, 'accounts'),
        orderBy('lastLoginAt', 'desc'),
        limit(maxUsers)
      );

      const snapshot = await getDocs(usersQuery);
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        username: doc.data().profile?.username || doc.data().profile?.displayName || 'Anonymous',
        level: doc.data().profile?.level || 1,
        points: doc.data().totalPoints || doc.data().profile?.totalPoints || 0,
      }));

      return users;
    } catch (error) {
      return [];
    }
  }
}

export const gameSocialService = new GameSocialService();
