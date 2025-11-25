'use client';

import React, { useState, useEffect } from 'react';
import { referralInvitationService, ReferralInvitation } from '@/lib/services/referral-invitation-service';
import { formatWalletAddress } from '@/utils/helpers/formatting';
import { formatDate } from '@/utils/helpers/formatting';
import { accountService } from '@/lib/services/account-service';

interface MyReferralsViewProps {
  referrerWalletAddress: string;
}

interface EnrichedReferralInvitation extends ReferralInvitation {
  username?: string | null;
}

export const MyReferralsView: React.FC<MyReferralsViewProps> = ({ referrerWalletAddress }) => {
  const [invitations, setInvitations] = useState<EnrichedReferralInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, [referrerWalletAddress]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await referralInvitationService.getInvitationsByReferrer(referrerWalletAddress);
      
      // Enrich with username data
      const enrichedData: EnrichedReferralInvitation[] = await Promise.all(
        data.map(async (invitation) => {
          if (invitation.status === 'activated' && invitation.referredWalletAddress) {
            try {
              const account = await accountService.getAccountByWalletAddress(invitation.referredWalletAddress);
              return {
                ...invitation,
                username: account?.profile?.displayName || account?.displayName || 'Anonymous User',
              };
            } catch (err) {
              // If we can't fetch the account, just use the invitation data
              console.warn('Failed to fetch account for invitation:', err);
              return {
                ...invitation,
                username: null,
              };
            }
          }
          return {
            ...invitation,
            username: null,
          };
        })
      );
      
      setInvitations(enrichedData);
    } catch (err: any) {
      console.error('Error loading referrals:', err);
      // Show more specific error messages
      let errorMessage = 'Failed to load referrals. Please try again.';
      if (err?.code === 'failed-precondition' || err?.message?.includes('index')) {
        errorMessage = 'Loading referrals... (Index is being created. This may take a few minutes.)';
      } else if (err?.message) {
        errorMessage = `Error: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        <span className="ml-3 text-white">Loading referrals...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-red-400 mb-2 font-medium">{error}</p>
          {error.includes('Index') && (
            <p className="text-sm text-white/60 mt-2">
              Firebase is creating an index. This usually takes 1-2 minutes.
            </p>
          )}
        </div>
        <button
          onClick={loadInvitations}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition"
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-bold text-white mb-2">No Referrals Yet</h3>
          <p className="text-white/60 mb-4 max-w-md mx-auto">
            Start building your referral network! Invite friends and earn points when they join.
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10 max-w-md mx-auto">
          <p className="text-sm text-white/80 mb-2">💡 How it works:</p>
          <ul className="text-left text-sm text-white/60 space-y-1">
            <li>• Go to the <span className="text-cyan-400">📧 Email Invitation</span> tab</li>
            <li>• Enter your friend's email address</li>
            <li>• Send them your referral code</li>
            <li>• Earn points when they join! 🎉</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">My Referrals</h3>
        <button
          onClick={loadInvitations}
          className="text-sm text-cyan-400 hover:text-cyan-300 transition"
          title="Refresh"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/20">
              <th className="text-left py-3 px-4 text-white/80 font-semibold">Username</th>
              <th className="text-left py-3 px-4 text-white/80 font-semibold">Wallet</th>
              <th className="text-left py-3 px-4 text-white/80 font-semibold">Email</th>
              <th className="text-left py-3 px-4 text-white/80 font-semibold">Invited</th>
              <th className="text-left py-3 px-4 text-white/80 font-semibold">Activated</th>
              <th className="text-left py-3 px-4 text-white/80 font-semibold">Status</th>
              <th className="text-right py-3 px-4 text-white/80 font-semibold">Points</th>
            </tr>
          </thead>
          <tbody>
            {invitations.map((invitation) => (
              <tr
                key={invitation.id}
                className="border-b border-white/10 hover:bg-white/5 transition-colors"
              >
                <td className="py-3 px-4 text-white">
                  {invitation.status === 'activated' && invitation.username
                    ? invitation.username
                    : invitation.invitedEmail.split('@')[0]}
                </td>
                <td className="py-3 px-4 text-white/70 font-mono text-xs">
                  {invitation.status === 'activated' && invitation.referredWalletAddress
                    ? formatWalletAddress(invitation.referredWalletAddress)
                    : '-'}
                </td>
                <td className="py-3 px-4 text-white/70 text-xs">
                  {invitation.invitedEmail}
                </td>
                <td className="py-3 px-4 text-white/60 text-xs">
                  {invitation.invitedAt
                    ? formatDate(invitation.invitedAt.toDate(), {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '-'}
                </td>
                <td className="py-3 px-4 text-white/60 text-xs">
                  {invitation.activatedAt
                    ? formatDate(invitation.activatedAt.toDate(), {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '-'}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      invitation.status === 'activated'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}
                  >
                    {invitation.status === 'activated' ? '✅ Activated' : '⏳ Pending'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  {invitation.status === 'activated' && invitation.pointsEarned ? (
                    <span className="text-green-400 font-semibold">
                      +{invitation.pointsEarned}
                    </span>
                  ) : (
                    <span className="text-white/30">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="flex justify-between items-center text-sm">
          <span className="text-white/60">
            Total Referrals: <span className="text-white font-semibold">{invitations.length}</span>
          </span>
          <span className="text-white/60">
            Activated: <span className="text-green-400 font-semibold">
              {invitations.filter(i => i.status === 'activated').length}
            </span>
          </span>
          <span className="text-white/60">
            Pending: <span className="text-yellow-400 font-semibold">
              {invitations.filter(i => i.status === 'pending').length}
            </span>
          </span>
          <span className="text-white/60">
            Total Points: <span className="text-cyan-400 font-semibold">
              {invitations
                .filter(i => i.status === 'activated')
                .reduce((sum, i) => sum + (i.pointsEarned || 0), 0)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

