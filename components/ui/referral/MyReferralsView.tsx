'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  referralInvitationService,
  ReferralInvitation,
} from '@/lib/services/referral-invitation-service';
import { formatWalletAddress } from '@/utils/helpers/formatting';
import { formatDate } from '@/utils/helpers/formatting';
import { accountService } from '@/lib/services/account-service';

interface MyReferralsViewProps {
  referrerWalletAddress: string;
  referralCode?: string;
  referralLink?: string;
  referrerName?: string;
}

interface EnrichedReferralInvitation extends ReferralInvitation {
  username?: string | null;
}

export const MyReferralsView: React.FC<MyReferralsViewProps> = ({
  referrerWalletAddress,
}) => {
  const [referrals, setReferrals] = useState<EnrichedReferralInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReferrals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Only fetch activated referrals
      const data = await referralInvitationService.getActivatedReferrals(referrerWalletAddress);

      // Enrich with username data
      const enrichedData: EnrichedReferralInvitation[] = await Promise.all(
        data.map(async referral => {
          if (referral.referredWalletAddress) {
            try {
              const account = await accountService.getAccountByWalletAddress(
                referral.referredWalletAddress
              );
              return {
                ...referral,
                username: account?.profile?.displayName || account?.displayName || 'Anonymous User',
              };
            } catch (err) {
              console.warn('Failed to fetch account for referral:', err);
              return {
                ...referral,
                username: null,
              };
            }
          }
          return {
            ...referral,
            username: null,
          };
        })
      );

      setReferrals(enrichedData);
    } catch (err: any) {
      console.error('Error loading referrals:', err);
      let errorMessage = 'Failed to load referrals. Please try again.';
      if (err?.code === 'failed-precondition' || err?.message?.includes('index')) {
        errorMessage =
          'Loading referrals... (Index is being created. This may take a few minutes.)';
      } else if (err?.message) {
        errorMessage = `Error: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [referrerWalletAddress]);

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500'></div>
        <span className='ml-3 text-white'>Loading referrals...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-8'>
        <div className='mb-4'>
          <div className='text-4xl mb-2'>⚠️</div>
          <p className='text-red-400 mb-2 font-medium'>{error}</p>
          {error.includes('Index') && (
            <p className='text-sm text-white/60 mt-2'>
              Firebase is creating an index. This usually takes 1-2 minutes.
            </p>
          )}
        </div>
        <button
          onClick={loadReferrals}
          className='px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition'
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  if (referrals.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='mb-4'>
          <div className='text-6xl mb-4'>👥</div>
          <h3 className='text-xl font-bold text-white mb-2'>No Referrals Yet</h3>
          <p className='text-white/60 mb-4 max-w-md mx-auto'>
            Start building your referral network! Share your referral code and earn points when friends join.
          </p>
        </div>
        <div className='bg-white/5 rounded-lg p-4 border border-white/10 max-w-md mx-auto'>
          <p className='text-sm text-white/80 mb-2'>💡 How it works:</p>
          <ul className='text-left text-sm text-white/60 space-y-1'>
            <li>
              • Share your referral code from the <span className='text-cyan-400'>🎴 Nexus Card</span> tab
            </li>
            <li>• Friends apply your code in the <span className='text-cyan-400'>🎁 Apply Code</span> tab</li>
            <li>• You both earn bonus points! 🎉</li>
            <li>• Track all your referrals here</li>
          </ul>
        </div>
      </div>
    );
  }

  const totalPoints = referrals.reduce((sum, r) => sum + (r.pointsEarned || 0), 0);

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-lg font-bold text-white'>My Referrals</h3>
        <button
          onClick={loadReferrals}
          className='text-sm text-cyan-400 hover:text-cyan-300 transition'
          title='Refresh'
        >
          🔄 Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className='grid grid-cols-2 gap-4 mb-4'>
        <div className='bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-lg p-4'>
          <div className='text-2xl font-bold text-green-400'>{referrals.length}</div>
          <div className='text-sm text-white/70'>Total Referrals</div>
        </div>
        <div className='bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30 rounded-lg p-4'>
          <div className='text-2xl font-bold text-cyan-400'>+{totalPoints}</div>
          <div className='text-sm text-white/70'>Points Earned</div>
        </div>
      </div>

      {/* Referrals Table */}
      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b border-white/20'>
              <th className='text-left py-3 px-4 text-white/80 font-semibold'>User</th>
              <th className='text-left py-3 px-4 text-white/80 font-semibold'>Wallet Address</th>
              <th className='text-left py-3 px-4 text-white/80 font-semibold'>Date Joined</th>
              <th className='text-right py-3 px-4 text-white/80 font-semibold'>Points Earned</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map(referral => (
              <tr
                key={referral.id}
                className='border-b border-white/10 hover:bg-white/5 transition-colors'
              >
                <td className='py-3 px-4 text-white'>
                  <div className='flex items-center gap-2'>
                    <div className='w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs'>
                      {referral.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span>{referral.username || 'Anonymous User'}</span>
                  </div>
                </td>
                <td className='py-3 px-4 text-white/70 font-mono text-xs'>
                  {referral.referredWalletAddress
                    ? formatWalletAddress(referral.referredWalletAddress)
                    : '-'}
                </td>
                <td className='py-3 px-4 text-white/60 text-xs'>
                  {referral.activatedAt && referral.activatedAt.toDate
                    ? formatDate(referral.activatedAt.toDate(), {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                    : '-'}
                </td>
                <td className='py-3 px-4 text-right'>
                  <span className='text-green-400 font-semibold'>
                    +{referral.pointsEarned || 0}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
