'use client';

import React, { useState, useEffect } from 'react';

import { Account } from '@/lib/firebase/firebase-types';
import { applyReferralCodeForExistingUser } from '@/lib/services/referral-service';
import { PokemonReferralCard } from './PokemonReferralCard';
import { MyReferralsView } from './MyReferralsView';
import { ReferralModalTab } from '@/lib/constants/modal.constants';
import { REFERRAL_CODE } from '@/lib/constants/referral.constants';
import { useToast } from '@/contexts/ui/ToastContext';

interface ReferralInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Usamos el tipo Account que es el que se pasa desde UserDropdown
  account: Account | null;
  // Prop para forzar la recarga de datos del usuario, si es necesario
  onAccountUpdate: () => void;
  // Prop para mostrar el modal de bonificación después de aplicar el código
  showBonusModal: (referrerName: string, bonus: number, referralCode: string) => void;
}

interface ApplyCodeViewProps {
  userWalletAddress: string;
  onApplySuccess: (referrerName: string, bonus: number, referralCode: string) => void;
  isAlreadyReferred: boolean;
}

const ApplyCodeView: React.FC<ApplyCodeViewProps> = ({
  userWalletAddress,
  onApplySuccess,
  isAlreadyReferred,
}) => {
  // NOTA: Asumo que useState y applyReferralCodeForExistingUser están disponibles en el scope.
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleApply = async () => {
    // Bloquear si ya fue referido, está cargando, o el código está vacío/incompleto
    if (!code || loading || isAlreadyReferred || code.length !== REFERRAL_CODE.LENGTH) return;

    setLoading(true);
    setStatusMessage('Applying code...');

    try {
      // Llama al servicio de backend para aplicar el código
      const result = await applyReferralCodeForExistingUser(userWalletAddress, code);

      if (result.success) {
        setStatusMessage(`✅ ${result.message}`);
        setCode('');
        if (result.referrerName && result.bonusEarned) {
          onApplySuccess(result.referrerName, result.bonusEarned, code);
        }
      } else {
        setStatusMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      setStatusMessage('Network or internal error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-4'>
      {isAlreadyReferred ? (
        <div className='bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-4'>
          <p className='text-green-400 text-sm font-medium'>
            ✅ You've already applied a referral code! You can still invite friends using your own
            referral code.
          </p>
        </div>
      ) : (
        <p className='text-white text-sm'>
          Enter your friend's 8-character code to receive your welcome bonus. 🎮
        </p>
      )}
      <input
        type='text'
        placeholder='FRIEND CODE (8 CHARACTERS)'
        value={code}
        onChange={e => setCode(e.target.value.toUpperCase().slice(0, REFERRAL_CODE.LENGTH))}
        maxLength={REFERRAL_CODE.LENGTH}
        className='w-full px-4 py-3 bg-white/10 border border-white rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300'
        disabled={loading || isAlreadyReferred}
      />

      <button
        onClick={handleApply}
        disabled={loading || code.length !== REFERRAL_CODE.LENGTH || isAlreadyReferred}
        className='w-full bg-cyan-400 hover:bg-cyan-600 text-black br-cyan-300 font-semibold py-3 px-4 rounded-xl transition disabled:opacity-50'
      >
        {isAlreadyReferred ? 'Already Applied ✓' : loading ? 'Applying...' : 'Apply Code'}
      </button>

      {statusMessage && (
        <p
          className={`mt-3 text-sm font-medium ${statusMessage.startsWith('✅') ? 'text-green-400' : 'text-gray-500'}`}
        >
          {statusMessage}
        </p>
      )}
    </div>
  );
};

export const ReferralInvitationModal: React.FC<ReferralInvitationModalProps> = ({
  isOpen,
  onClose,
  account,
  onAccountUpdate,
  showBonusModal,
}) => {
  const [activeTab, setActiveTab] = useState<ReferralModalTab>(ReferralModalTab.CARD);
  const { addToast } = useToast();

  // If user has already applied a referral code and is on the apply-code tab, switch to card tab
  useEffect(() => {
    if (account?.referredBy && activeTab === ReferralModalTab.APPLY_CODE) {
      setActiveTab(ReferralModalTab.CARD);
    }
  }, [account?.referredBy, activeTab]);

  if (!isOpen || !account) return null;

  // Generación de datos... (El código ya estaba correcto)
  const referralCode = account.referralCode || account.walletAddress.slice(-8).toUpperCase();
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;
  const referrerName = account?.profile?.displayName || 'Nexus Explorer';

  const handleCopyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      addToast({
        title: 'Copied!',
        message: `Referral code ${referralCode} copied to clipboard`,
        type: 'success',
      });
    } catch (error) {
      addToast({
        title: 'Copy Failed',
        message: 'Failed to copy referral code. Please try again.',
        type: 'error',
      });
    }
  };

  return (
    <div
      className='fixed inset-0 flex items-center justify-center z-50 p-4'
      style={{ marginTop: '350px' }}
    >
      {/* ... (Modal Overlay y Contenedor) ... */}
      <div className='bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 w-full max-w-2xl mx-4 border border-white/20 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto'>
        <div className='relative z-10'>
          <div className='flex justify-between items-center p-4 border-b border-gray-700'>
            <div className='flex items-center gap-3'>
              <h2 className='text-xl font-bold'>Referral Center</h2>
              <div className='flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg border border-white/20'>
                <span className='text-sm font-mono text-cyan-400 font-semibold'>{referralCode}</span>
                <button
                  onClick={handleCopyReferralCode}
                  className='p-1.5 hover:bg-white/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400'
                  aria-label='Copy referral code'
                  title='Copy referral code'
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-4 w-4 text-white'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* AÑADIR ESTE BOTÓN DE CIERRE */}
          </div>
          <div className='flex border-b border-white/20 mb-6'>
            <button
              onClick={onClose} // Llama a la prop de cierre
              // Clases clave para posicionamiento: 'absolute top-4 right-4'
              // La 'X' se moverá al punto top-4 y right-4 de su contenedor 'relative' más cercano
              className='absolute top-4 right-4 text-white hover:text-gray-400 focus:outline-none p-1 rounded-full bg-white/10'
              aria-label='Cerrar modal'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-6 w-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                strokeWidth={2}
              >
                <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>

            <button
              onClick={() => setActiveTab(ReferralModalTab.CARD)}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === ReferralModalTab.CARD
                ? 'text-white border-b-2 border-cyan-500'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              🎴 Nexus Card
            </button>

            {/* Apply Code tab - only show if user hasn't applied a referral code yet */}
            {!account.referredBy && (
              <button
                onClick={() => setActiveTab(ReferralModalTab.APPLY_CODE)}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === ReferralModalTab.APPLY_CODE
                  ? 'text-white border-b-2 border-cyan-500'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                🎁 Apply Code
              </button>
            )}

            {/* My Referrals tab */}
            <button
              onClick={() => setActiveTab(ReferralModalTab.MY_REFERRALS)}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === ReferralModalTab.MY_REFERRALS
                ? 'text-white border-b-2 border-cyan-500'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              👥 My Referrals
            </button>
          </div>

          {/* Tab Content */}

          {activeTab === ReferralModalTab.APPLY_CODE ? (
            // Apply Code tab - available for all users
            <ApplyCodeView
              userWalletAddress={account.walletAddress}
              isAlreadyReferred={!!account.referredBy}
              onApplySuccess={(name, bonus, code) => {
                showBonusModal(name, bonus, code);
                onAccountUpdate();
              }}
            />
          ) : activeTab === ReferralModalTab.MY_REFERRALS ? (
            // My Referrals tab
            <MyReferralsView
              referrerWalletAddress={account.walletAddress}
              referralCode={referralCode}
              referralLink={referralLink}
            />
          ) : (
            /* Card View */
            <div className='flex justify-center'>
              <PokemonReferralCard account={account} />

              {account.stats?.referralsCount !== undefined && account.stats.referralsCount > 0 && (
                <div className='mt-4 text-center text-white'>
                  <p className='text-sm opacity-80'>
                    You have referred <span className='font-bold text-green-400'>{account.stats.referralsCount}</span> friends
                    and earned <span className='font-bold text-yellow-400'>{account.stats.totalReferralPoints} XP</span>!
                  </p>
                </div>
              )}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferralInvitationModal;
