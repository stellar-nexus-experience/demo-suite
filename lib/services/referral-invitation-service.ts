import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { ReferralStatus } from '../constants/referral.constants';

export interface ReferralInvitation {
  id: string;
  referrerWalletAddress: string;
  referralCode: string;
  invitedEmail: string;
  status: ReferralStatus;
  invitedAt: Timestamp;
  activatedAt?: Timestamp;
  referredWalletAddress?: string;
  pointsEarned?: number;
}

export class ReferralInvitationService {
  private static instance: ReferralInvitationService;

  public static getInstance(): ReferralInvitationService {
    if (!ReferralInvitationService.instance) {
      ReferralInvitationService.instance = new ReferralInvitationService();
    }
    return ReferralInvitationService.instance;
  }

  /**
   * Get only activated referrals for a referrer (for My Referrals tab)
   * Returns referrals where users have actually applied the code
   */
  async getActivatedReferrals(referrerWalletAddress: string): Promise<ReferralInvitation[]> {
    const invitationsRef = collection(db, 'referralInvitations');

    let querySnapshot;
    try {
      // Try with orderBy first (requires composite index)
      const q = query(
        invitationsRef,
        where('referrerWalletAddress', '==', referrerWalletAddress),
        where('status', '==', ReferralStatus.ACTIVATED),
        orderBy('activatedAt', 'desc')
      );
      querySnapshot = await getDocs(q);
    } catch (error: any) {
      // If index is missing, try without orderBy
      if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
        const q = query(
          invitationsRef,
          where('referrerWalletAddress', '==', referrerWalletAddress),
          where('status', '==', ReferralStatus.ACTIVATED)
        );
        querySnapshot = await getDocs(q);
      } else {
        throw error;
      }
    }

    const activatedReferrals: ReferralInvitation[] = [];

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();

      activatedReferrals.push({
        id: docSnap.id,
        referrerWalletAddress: data.referrerWalletAddress,
        referralCode: data.referralCode,
        invitedEmail: data.invitedEmail || '',
        status: data.status as ReferralStatus,
        invitedAt: data.invitedAt,
        activatedAt: data.activatedAt,
        referredWalletAddress: data.referredWalletAddress,
        pointsEarned: data.pointsEarned || 0,
      } as ReferralInvitation);
    }

    // Sort manually by activatedAt if we couldn't use orderBy
    activatedReferrals.sort((a, b) => {
      if (!a.activatedAt || !b.activatedAt) return 0;
      return b.activatedAt.toMillis() - a.activatedAt.toMillis();
    });

    return activatedReferrals;
  }

  /**
   * Update invitation status to activated when referral code is applied
   * This is called when a user applies a referral code
   */
  async activateInvitation(
    referralCode: string,
    referredWalletAddress: string,
    pointsEarned: number
  ): Promise<void> {
    const invitationsRef = collection(db, 'referralInvitations');

    // Find pending invitations with this referral code
    const q = query(
      invitationsRef,
      where('referralCode', '==', referralCode),
      where('status', '==', ReferralStatus.PENDING)
    );

    const querySnapshot = await getDocs(q);

    // Update all matching pending invitations
    const updatePromises = querySnapshot.docs.map(async docSnap => {
      const invitationRef = doc(db, 'referralInvitations', docSnap.id);

      await updateDoc(invitationRef, {
        status: ReferralStatus.ACTIVATED,
        activatedAt: serverTimestamp(),
        referredWalletAddress: referredWalletAddress,
        pointsEarned: pointsEarned,
      });
    });

    await Promise.all(updatePromises);
  }
}

// Export singleton instance
export const referralInvitationService = ReferralInvitationService.getInstance();
