import { accountService } from './account-service';
import { db } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { REFERRAL_REWARDS } from '../../utils/constants/referral/constants';
import { UserAccount } from '@/utils/types/account';
import { referralInvitationService } from './referral-invitation-service'; 



interface CreateReferralRecordParams {
  referrerWalletAddress: string;
  referredWalletAddress: string;
  referralCode: string;
  referrerPointsAwarded: number;
  referredPointsAwarded: number;
}

interface ReferralValidationResult {
  referrerWalletAddress: string | null;
  applied: boolean;
  referrerAccount: UserAccount | null;
}

interface ApplyReferralResult {
  success: boolean;
  message: string;
  referrerName?: string;
  bonusEarned?: number;
}

// --- Funciones del Servicio ---
export async function createReferralRecord(data: CreateReferralRecordParams): Promise<void> {
  const referralRef = collection(db, 'referrals');
  
  await addDoc(referralRef, {
    ...data,
    referredAt: serverTimestamp(),
    status: 'completed',
  });
}


export async function validateReferralCode(
  userWalletAddress: string,
  pendingReferralCode: string | null
): Promise<ReferralValidationResult> {
  
  if (!pendingReferralCode) {
    return { referrerWalletAddress: null, applied: false, referrerAccount: null };
  }
  
  // 1. Validar formato (8 caracteres alfanuméricos en mayúsculas)
  if (!/^[A-Z0-9]{8}$/.test(pendingReferralCode)) {
      console.warn('Referral Code Format Error:', pendingReferralCode);
      return { referrerWalletAddress: null, applied: false, referrerAccount: null };
  }

  // 2. Buscar Referidor por código
  const referrerAccount = await accountService.getAccountByReferralCode(pendingReferralCode);
  
  if (!referrerAccount) {
    console.warn('Referral Code Not Found:', pendingReferralCode);
    return { referrerWalletAddress: null, applied: false, referrerAccount: null };
  }
  
  const referrerWalletAddress = referrerAccount.walletAddress;

  // 3. Prevenir auto-referido
  if (referrerWalletAddress === userWalletAddress) {
    console.warn('Self-Referral Attempt Blocked');
    return { referrerWalletAddress: null, applied: false, referrerAccount: null };
  }
  
  // Si pasa todas las validaciones
  return { 
    referrerWalletAddress, 
    applied: true, 
    referrerAccount 
  };
}


export async function applyReferralCodeForExistingUser(
  userWalletAddress: string,
  referralCode: string
): Promise<ApplyReferralResult> {

  // 1. Validar el código y obtener datos del referidor
  const validation = await validateReferralCode(
    userWalletAddress,
    referralCode
  );

  if (!validation.applied || !validation.referrerWalletAddress || !validation.referrerAccount) {
    return { success: false, message: 'Invalid or not found referral code.' };
  }

  const referrerWalletAddress = validation.referrerWalletAddress;
  const referrerAccount = validation.referrerAccount;

  // 2. Comprobar si el usuario ya tiene un referidor 
  const existingAccount = await accountService.getAccountByWalletAddress(userWalletAddress);
  if (existingAccount?.referredBy) {
    return { success: false, message: 'You have already used a referral code previously.' };
  }
  
  // 3. Obtener recompensas
  const referredBonusPoints = REFERRAL_REWARDS.REFERRED_POINTS;
  const referredBonusXP = REFERRAL_REWARDS.REFERRED_XP;
  // Define la recompensa del referidor (necesaria para el registro histórico)
  const referrerBonusPoints = REFERRAL_REWARDS.REFERRER_POINTS;


  try {
    // 4. Aplicar premios al usuario existente
    await accountService.addExperienceAndPoints(
      userWalletAddress,
      referredBonusXP,
      referredBonusPoints
    );

    // 5. Premiar al referidor e incrementar estadísticas
    await accountService.addExperienceAndPoints(
      referrerWalletAddress,
      REFERRAL_REWARDS.REFERRER_XP,
      referrerBonusPoints
    );
    
   
    await accountService.incrementReferralStats(referrerWalletAddress); 
    
    // 6. Crear el registro de referido
    await createReferralRecord({
      referrerWalletAddress: referrerWalletAddress,
      referredWalletAddress: userWalletAddress,
      referralCode: referralCode,
      referrerPointsAwarded: referrerBonusPoints,
      referredPointsAwarded: referredBonusPoints,
    });
    
    // 7. Marcar al usuario existente como referido
    await accountService.updateAccount(userWalletAddress, {
      referredBy: referrerWalletAddress,
      // Usamos el 'as any' para manejar el tipo de retorno de serverTimestamp()
      referredAt: serverTimestamp() as any, 
    });

    // 8. Activate any pending invitations for this referral code
    await referralInvitationService.activateInvitation(
      referralCode,
      userWalletAddress,
      referrerBonusPoints
    );

    // 9. Create a referral invitation record if one doesn't exist (for users who applied code without email invite)
    // This ensures the referral shows up in the referrer's My Referrals tab
    try {
      const existingInvitations = await referralInvitationService.getInvitationsByReferrer(referrerWalletAddress);
      const hasMatchingInvitation = existingInvitations.some(
        inv => inv.referredWalletAddress === userWalletAddress && inv.referralCode === referralCode
      );

      if (!hasMatchingInvitation) {
        // Create a new invitation record for this referral (status: activated since they already joined)
        const invitationsRef = collection(db, 'referralInvitations');
        const invitationDocRef = await addDoc(invitationsRef, {
          referrerWalletAddress: referrerWalletAddress,
          referralCode: referralCode,
          invitedEmail: '', // No email since they applied code directly
          status: 'activated',
          invitedAt: serverTimestamp(),
          activatedAt: serverTimestamp(),
          referredWalletAddress: userWalletAddress,
          pointsEarned: referrerBonusPoints,
        });

        // Also update the referrer's account document
        try {
          const accountRef = doc(db, 'accounts', referrerWalletAddress);
          const accountDocSnap = await getDoc(accountRef);
          
          if (accountDocSnap.exists()) {
            const accountData = accountDocSnap.data();
            const referralInvitations = accountData.referralInvitations || [];
            
            // Add the new invitation to the array
            referralInvitations.push({
              invitationId: invitationDocRef.id,
              invitedEmail: '',
              status: 'activated',
              referredWalletAddress: userWalletAddress,
              pointsEarned: referrerBonusPoints,
              invitedAt: serverTimestamp(),
              activatedAt: serverTimestamp(),
            });
            
            await updateDoc(accountRef, {
              referralInvitations: referralInvitations,
            });
          }
        } catch (error) {
          console.warn('Failed to update account with new referral invitation:', error);
        }
      }
    } catch (error) {
      // Silently fail - the referral is still applied, just the invitation record creation failed
      console.warn('Failed to create referral invitation record:', error);
    }


    return {
      success: true,
      
      message: `Referral applied! You won 💰 ${referredBonusPoints} pts thanks to ${referrerAccount.profile?.displayName ?? 'Your Friend'}.`, 
      referrerName: referrerAccount.profile?.displayName,
      bonusEarned: referredBonusPoints,
    };
    
  } catch (error) {
    console.error('Error during the application of the referral:', error);
    // Este mensaje indica que la falla está en el paso 4, 5, 6, o 7
    return { success: false, message: 'Internal error applying referral code.' };
  }
}