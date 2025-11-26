/**
 * Modal tab identifiers for the Referral Center
 */
export enum ReferralModalTab {
    /** Nexus Card tab - displays user's referral card */
    CARD = 'card',
    /** Apply Code tab - allows users to apply a friend's referral code */
    APPLY_CODE = 'apply-code',
    /** My Referrals tab - shows list of users who used your code */
    MY_REFERRALS = 'my-referrals',
}

/**
 * Type guard to check if a string is a valid ReferralModalTab
 */
export function isReferralModalTab(value: string): value is ReferralModalTab {
    return Object.values(ReferralModalTab).includes(value as ReferralModalTab);
}
