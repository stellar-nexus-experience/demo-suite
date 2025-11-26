import { accountService } from './account-service';
import { db } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { REFERRAL_REWARDS, REFERRAL_CODE } from '../constants/referral.constants';
import { UserAccount } from '@/utils/types/account';

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

/**
 * Create a referral record in Firestore
 */
export async function createReferralRecord(data: CreateReferralRecordParams): Promise<void> {
  const referralRef = collection(db, 'referrals');

  await addDoc(referralRef, {
    ...data,
    referredAt: serverTimestamp(),
    status: 'completed',
  });
}

/**
 * Validate a referral code and return referrer information
 */
export async function validateReferralCode(
  userWalletAddress: string,
  pendingReferralCode: string | null
): Promise<ReferralValidationResult> {
  if (!pendingReferralCode) {
    return { referrerWalletAddress: null, applied: false, referrerAccount: null };
  }

  // Validate format using constant pattern
  if (!REFERRAL_CODE.PATTERN.test(pendingReferralCode)) {
    return { referrerWalletAddress: null, applied: false, referrerAccount: null };
  }

  // Find referrer by code
  const referrerAccount = await accountService.getAccountByReferralCode(pendingReferralCode);

  if (!referrerAccount) {
    return { referrerWalletAddress: null, applied: false, referrerAccount: null };
  }

  const referrerWalletAddress = referrerAccount.walletAddress;

  // Prevent self-referral
  if (referrerWalletAddress === userWalletAddress) {
    return { referrerWalletAddress: null, applied: false, referrerAccount: null };
  }

  return {
    referrerWalletAddress,
    applied: true,
    referrerAccount,
  };
}

/**
 * Apply a referral code for an existing user
 */
export async function applyReferralCodeForExistingUser(
  userWalletAddress: string,
  referralCode: string
): Promise<ApplyReferralResult> {
  // Validate the code and get referrer data
  const validation = await validateReferralCode(userWalletAddress, referralCode);

  if (!validation.applied || !validation.referrerWalletAddress || !validation.referrerAccount) {
    return { success: false, message: 'Invalid or not found referral code.' };
  }

  const referrerWalletAddress = validation.referrerWalletAddress;
  const referrerAccount = validation.referrerAccount;

  // Check if user already has a referrer
  const existingAccount = await accountService.getAccountByWalletAddress(userWalletAddress);
  if (existingAccount?.referredBy) {
    return { success: false, message: 'You have already used a referral code previously.' };
  }

  // Get rewards from constants
  const referredBonusPoints = REFERRAL_REWARDS.REFERRED_POINTS;
  const referredBonusXP = REFERRAL_REWARDS.REFERRED_XP;
  const referrerBonusPoints = REFERRAL_REWARDS.REFERRER_POINTS;

  try {
    // Award points to the user
    await accountService.addExperienceAndPoints(
      userWalletAddress,
      referredBonusXP,
      referredBonusPoints
    );

    // Award points to the referrer
    await accountService.addExperienceAndPoints(
      referrerWalletAddress,
      REFERRAL_REWARDS.REFERRER_XP,
      referrerBonusPoints
    );

    // Increment referrer's stats
    await accountService.incrementReferralStats(referrerWalletAddress);

    // Create referral record
    await createReferralRecord({
      referrerWalletAddress: referrerWalletAddress,
      referredWalletAddress: userWalletAddress,
      referralCode: referralCode,
      referrerPointsAwarded: referrerBonusPoints,
      referredPointsAwarded: referredBonusPoints,
    });

    // Mark user as referred
    await accountService.updateAccount(userWalletAddress, {
      referredBy: referrerWalletAddress,
      referredAt: serverTimestamp() as any,
    });

    return {
      success: true,
      message: `Referral applied! You won 💰 ${referredBonusPoints} pts thanks to ${referrerAccount.profile?.displayName ?? 'Your Friend'}.`,
      referrerName: referrerAccount.profile?.displayName,
      bonusEarned: referredBonusPoints,
    };
  } catch (error) {
    return { success: false, message: 'Internal error applying referral code.' };
  }
}
