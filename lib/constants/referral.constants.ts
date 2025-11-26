/**
 * Referral system constants and enums
 * Centralized configuration for referral code validation and rewards
 */

/**
 * Referral invitation status
 */
export enum ReferralStatus {
    ACTIVATED = 'activated',
    PENDING = 'pending',
}

/**
 * Referral code configuration
 */
export const REFERRAL_CODE = {
    /** Required length for referral codes */
    LENGTH: 8,
    /** Validation pattern: 8 uppercase alphanumeric characters */
    PATTERN: /^[A-Z0-9]{8}$/,
} as const;

/**
 * Referral reward points and XP
 */
export const REFERRAL_REWARDS = {
    /** Points awarded to the referrer when someone uses their code */
    REFERRER_POINTS: 50,
    /** XP awarded to the referrer when someone uses their code */
    REFERRER_XP: 500,
    /** Points awarded to the user who applies a referral code */
    REFERRED_POINTS: 50,
    /** XP awarded to the user who applies a referral code */
    REFERRED_XP: 500,
} as const;

/**
 * Type for referral rewards (for type safety)
 */
export type ReferralRewards = typeof REFERRAL_REWARDS;
