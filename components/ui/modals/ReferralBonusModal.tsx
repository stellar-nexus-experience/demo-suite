'use client';

import React from 'react';
import { useFirebase } from '@/contexts/data/FirebaseContext';
import { useToast } from '@/contexts/ui/ToastContext';

interface ReferralBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  bonusEarned: number;
  referrerName: string;
  referralCode: string;
}

export const ReferralBonusModal: React.FC<ReferralBonusModalProps> = ({
  isOpen,
  onClose,
  bonusEarned,
  referrerName,
  referralCode,
}) => {
  const { addToast } = useToast();

  if (!isOpen) return null;

  const handleClaimBonus = () => {
    addToast({
      title: 'Bonus Claimed!',
      message: `You've successfully claimed ${bonusEarned} XP from ${referrerName}'s referral!`,
      type: 'success',
    });
    onClose();
  };

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 w-full max-w-md mx-4 border border-white/20 shadow-2xl relative overflow-hidden'>
        {/* Background Effects */}
        <div className='absolute inset-0 bg-gradient-to-br from-green-500/10 via-blue-500/10 to-purple-500/10'></div>
        <div className='absolute top-4 left-4 w-2 h-2 bg-green-400 rounded-full animate-ping'></div>
        <div className='absolute top-8 right-6 w-1 h-1 bg-blue-400 rounded-full animate-pulse'></div>
        <div className='absolute bottom-6 left-8 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce'></div>
        <div className='absolute bottom-4 right-4 w-1 h-1 bg-green-400 rounded-full animate-ping'></div>

        {/* Content */}
        <div className='relative z-10 text-center'>
          {/* Icon */}
          <div className='text-6xl mb-4 animate-bounce'>🎉</div>

          {/* Title */}
          <h2 className='text-2xl font-bold text-white mb-2'>Referral Bonus!</h2>

          {/* Subtitle */}
          <p className='text-white/70 mb-6'>
            You've been invited by{' '}
            <span className='text-green-400 font-semibold'>{referrerName}</span>
          </p>

          {/* Bonus Display */}
          <div className='bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-6 mb-6 border border-green-400/30'>
            <div className='text-3xl font-bold text-green-400 mb-2'>+{bonusEarned} XP</div>
            <div className='text-white/70 text-sm'>Welcome bonus for using referral code</div>
            <div className='text-green-300 font-mono text-xs mt-2'>{referralCode}</div>
          </div>

          {/* Description */}
          <p className='text-white/60 text-sm mb-6'>
            Your bonus has been automatically added to your account. Start exploring the platform to
            earn more rewards!
          </p>

          {/* Action Buttons */}
          <div className='flex gap-3'>
            <button
              onClick={handleClaimBonus}
              className='flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl'
            >
              Claim Bonus
            </button>
            <button
              onClick={onClose}
              className='px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 border border-white/20'
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralBonusModal;
