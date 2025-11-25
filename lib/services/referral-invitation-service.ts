import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { accountService } from './account-service';

export interface ReferralInvitation {
  id: string;
  referrerWalletAddress: string;
  referralCode: string;
  invitedEmail: string;
  status: 'pending' | 'activated';
  invitedAt: Timestamp;
  activatedAt?: Timestamp;
  referredWalletAddress?: string; // Set when activated
  pointsEarned?: number; // Points earned by referrer when activated
}

export interface CreateReferralInvitationParams {
  referrerWalletAddress: string;
  referralCode: string;
  invitedEmail: string;
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
   * Create a new referral invitation
   * Also stores a reference in the user's account document
   */
  async createInvitation(params: CreateReferralInvitationParams): Promise<string> {
    const invitationsRef = collection(db, 'referralInvitations');
    
    const invitationData = {
      referrerWalletAddress: params.referrerWalletAddress,
      referralCode: params.referralCode,
      invitedEmail: params.invitedEmail.toLowerCase().trim(),
      status: 'pending' as const,
      invitedAt: serverTimestamp(),
    };

    const docRef = await addDoc(invitationsRef, invitationData);
    const invitationId = docRef.id;

    // Also store a reference in the user's account document
    try {
      const accountRef = doc(db, 'accounts', params.referrerWalletAddress);
      await updateDoc(accountRef, {
        referralInvitations: arrayUnion({
          invitationId: invitationId,
          invitedEmail: params.invitedEmail.toLowerCase().trim(),
          status: 'pending',
          invitedAt: serverTimestamp(),
        }),
      });
    } catch (error) {
      // If account doesn't exist or update fails, continue anyway
      // The invitation is still created in the collection
      console.warn('Failed to update account with referral invitation:', error);
    }

    return invitationId;
  }

  /**
   * Get all invitations for a referrer
   * Tries with orderBy first, falls back to without orderBy if index is missing
   */
  async getInvitationsByReferrer(referrerWalletAddress: string): Promise<ReferralInvitation[]> {
    const invitationsRef = collection(db, 'referralInvitations');
    
    let querySnapshot;
    try {
      // Try with orderBy first (requires composite index)
      const q = query(
        invitationsRef,
        where('referrerWalletAddress', '==', referrerWalletAddress),
        orderBy('invitedAt', 'desc')
      );
      querySnapshot = await getDocs(q);
    } catch (error: any) {
      // If index is missing, try without orderBy
      if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
        console.warn('Composite index missing, fetching without orderBy:', error);
        const q = query(
          invitationsRef,
          where('referrerWalletAddress', '==', referrerWalletAddress)
        );
        querySnapshot = await getDocs(q);
      } else {
        throw error;
      }
    }

    const invitations: ReferralInvitation[] = [];

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();

      invitations.push({
        id: docSnap.id,
        referrerWalletAddress: data.referrerWalletAddress,
        referralCode: data.referralCode,
        invitedEmail: data.invitedEmail,
        status: data.status,
        invitedAt: data.invitedAt,
        activatedAt: data.activatedAt,
        referredWalletAddress: data.referredWalletAddress,
        pointsEarned: data.pointsEarned || 0,
      } as ReferralInvitation);
    }

    // Sort manually if we couldn't use orderBy
    invitations.sort((a, b) => {
      if (!a.invitedAt || !b.invitedAt) return 0;
      return b.invitedAt.toMillis() - a.invitedAt.toMillis();
    });

    return invitations;
  }

  /**
   * Update invitation status to activated when referral code is applied
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
      where('status', '==', 'pending')
    );

    const querySnapshot = await getDocs(q);
    
    // Update all matching pending invitations
    const updatePromises = querySnapshot.docs.map(async (docSnap) => {
      const invitationRef = doc(db, 'referralInvitations', docSnap.id);
      const invitationData = docSnap.data();
      
      // Update the invitation document
      await updateDoc(invitationRef, {
        status: 'activated',
        activatedAt: serverTimestamp(),
        referredWalletAddress: referredWalletAddress,
        pointsEarned: pointsEarned,
      });

      // Update the referrer's account document
      try {
        const accountRef = doc(db, 'accounts', invitationData.referrerWalletAddress);
        const accountDocSnap = await getDoc(accountRef);
        
        if (accountDocSnap.exists()) {
          const accountData = accountDocSnap.data();
          const referralInvitations = accountData.referralInvitations || [];
          
          // Find and update the specific invitation in the array
          const invitationIndex = referralInvitations.findIndex(
            (inv: any) => inv.invitationId === docSnap.id
          );
          
          if (invitationIndex !== -1) {
            const updatedInvitations = [...referralInvitations];
            updatedInvitations[invitationIndex] = {
              ...updatedInvitations[invitationIndex],
              status: 'activated',
              referredWalletAddress,
              pointsEarned,
              activatedAt: serverTimestamp(),
            };
            
            await updateDoc(accountRef, {
              referralInvitations: updatedInvitations,
            });
          }
        }
      } catch (error) {
        // Silently fail - the main invitation document is already updated
        console.warn('Failed to update account referral invitations array:', error);
      }
    });

    await Promise.all(updatePromises);
  }

  /**
   * Get invitation by email and referral code (for checking if email was already invited)
   */
  async getInvitationByEmailAndCode(
    email: string,
    referralCode: string
  ): Promise<ReferralInvitation | null> {
    const invitationsRef = collection(db, 'referralInvitations');
    const q = query(
      invitationsRef,
      where('invitedEmail', '==', email.toLowerCase().trim()),
      where('referralCode', '==', referralCode)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data();
    
    return {
      id: docSnap.id,
      ...data,
    } as ReferralInvitation;
  }
}

// Export singleton instance
export const referralInvitationService = ReferralInvitationService.getInstance();

