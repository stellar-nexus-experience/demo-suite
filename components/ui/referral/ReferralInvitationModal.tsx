'use client';

import React, { useState, useEffect } from 'react';

import { UserAccount } from '@/utils/types/account'; // Importar el tipo correcto
import { useToast } from '@/contexts/ui/ToastContext';
import { emailJSService } from '@/lib/services/emailjs-service';
import { applyReferralCodeForExistingUser } from '@/lib/services/referral-service'; 
import { PokemonReferralCard } from './PokemonReferralCard';
import { Account } from '@/lib/firebase/firebase-types';
import { referralInvitationService } from '@/lib/services/referral-invitation-service';
import { MyReferralsView } from './MyReferralsView';

// 1. Definir el nuevo tipo de pestaña
type Tab = 'card' | 'email' | 'apply-code' | 'my-referrals'; 

interface ReferralInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Usamos el tipo UserAccount completo que ya tiene los campos de referido
  account: UserAccount | null; 
  // Prop para forzar la recarga de datos del usuario, si es necesario
  onAccountUpdate: () => void; 
  // Prop para mostrar el modal de bonificación después de aplicar el código
  showBonusModal: (referrerName: string, bonus: number) => void;
}

interface ApplyCodeViewProps {
    userWalletAddress: string;
    onApplySuccess: (referrerName: string, bonus: number) => void;
    isAlreadyReferred: boolean; 
}

const ApplyCodeView: React.FC<ApplyCodeViewProps> = ({ 
    userWalletAddress, 
    onApplySuccess, 
    isAlreadyReferred 
}) => {
    // NOTA: Asumo que useState y applyReferralCodeForExistingUser están disponibles en el scope.
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const handleApply = async () => {
        // Bloquear si ya fue referido, está cargando, o el código está vacío/incompleto
        if (!code || loading || isAlreadyReferred || code.length !== 8) return; 
        
        setLoading(true);
        setStatusMessage('Applying code...');

        try {
            // Llama al servicio de backend para aplicar el código
            const result = await applyReferralCodeForExistingUser(userWalletAddress, code);

            if (result.success) {
                setStatusMessage(`✅ ${result.message}`);
                setCode('');
                if (result.referrerName && result.bonusEarned) {
                    onApplySuccess(result.referrerName, result.bonusEarned);
                }
            } else {
                setStatusMessage(`❌ ${result.message}`);
            }
        } catch (error) {
            setStatusMessage('Network or internal error.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {isAlreadyReferred ? (
                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-4">
                    <p className="text-green-400 text-sm font-medium">
                        ✅ You've already applied a referral code! You can still invite friends using your own referral code.
                    </p>
                </div>
            ) : (
                <p className="text-white text-sm">
                    Enter your friend's 8-character code to receive your welcome bonus. 🎮
                </p>
            )}
            <input
                type='text'
                placeholder='FRIEND CODE (8 CHARACTERS)'
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().slice(0, 8))}
                maxLength={8}
               
                className='w-full px-4 py-3 bg-white/10 border border-white rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300'
                disabled={loading || isAlreadyReferred} 
            />

            <button
                onClick={handleApply}
                disabled={loading || code.length !== 8 || isAlreadyReferred} 
                className='w-full bg-cyan-400 hover:bg-cyan-600 text-black br-cyan-300 font-semibold py-3 px-4 rounded-xl transition disabled:opacity-50'
            >
                {isAlreadyReferred 
                  ? 'Already Applied ✓' 
                  : (loading ? 'Applying...' : 'Apply Code') 
                }
            </button>
            
            {statusMessage && <p className={`mt-3 text-sm font-medium ${statusMessage.startsWith('✅') ? 'text-green-400' : 'text-gray-500'}`}>{statusMessage}</p>}
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
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // 2. Cambiamos el tipo de estado de pestaña
  const [activeTab, setActiveTab] = useState<Tab>('card'); 

  // If user has already applied a referral code and is on the apply-code tab, switch to card tab
  useEffect(() => {
    if (account?.referredBy && activeTab === 'apply-code') {
      setActiveTab('card');
    }
  }, [account?.referredBy, activeTab]);

  if (!isOpen || !account) return null;

  // Generación de datos... (El código ya estaba correcto)
  const referralCode = account.referralCode || account.walletAddress.slice(-8).toUpperCase(); 
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;
  const referrerName = account?.profile?.displayName || 'Nexus Explorer';

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      addToast({
        type: 'error',
        title: 'Email Required',
        message: 'Please enter an email address to send the invitation.',
      });
      return;
    }

    setIsSending(true);

    try {
      // Check if this email was already invited with this referral code
      const existingInvitation = await referralInvitationService.getInvitationByEmailAndCode(
        email,
        referralCode
      );

      if (existingInvitation) {
        addToast({
          type: 'warning',
          title: 'Already Invited',
          message: 'This email has already been invited. You can resend the invitation from the "My Referrals" tab.',
        });
        setIsSending(false);
        return;
      }

      // Send email invitation
      let emailSent = false;
      if (emailJSService.isConfigured()) {
        try {
          await emailJSService.sendReferralInvitation({
            user_email: email,
            referral_code: referralCode,
            referral_link: referralLink,
            referrer_name: referrerName,
            personal_message: personalMessage || undefined,
          });
          emailSent = true;
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
          // Continue to save invitation even if email fails
        }
      }

      // Save invitation to database (always save, even if email wasn't sent)
      await referralInvitationService.createInvitation({
        referrerWalletAddress: account.walletAddress,
        referralCode: referralCode,
        invitedEmail: email,
      });

      if (emailSent) {
        addToast({
          type: 'success',
          title: '✅ Invitation Sent!',
          message: `Your referral invitation has been sent to ${email}. They can use your code ${referralCode} or click the link to join!`,
        });
      } else if (emailJSService.isConfigured()) {
        addToast({
          type: 'warning',
          title: '⚠️ Email Not Sent',
          message: `Invitation saved but email failed to send. You can share your referral link manually: ${referralLink}`,
        });
      } else {
        addToast({
          type: 'info',
          title: '📋 Invitation Saved',
          message: `Invitation saved! Share your referral link: ${referralLink} (Email service not configured)`,
        });
      }
      setEmail('');
      setPersonalMessage('');
    } catch (error) {
      console.error('Error sending invitation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invitation. Please try again.';
      addToast({
        type: 'error',
        title: '❌ Send Failed',
        message: errorMessage,
      });
    } finally {
      setIsSending(false);
    }
  };


  const handleClose = () => {
    if (!isSending) {
      setEmail('');
      setPersonalMessage('');
      onClose();
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
              <h2 className='text-xl font-bold'>Referral Center</h2>
              
              {/* AÑADIR ESTE BOTÓN DE CIERRE */}
              
          </div>
          <div className='flex border-b border-white/20 mb-6'>
          <button
              onClick={onClose} // Llama a la prop de cierre
              // Clases clave para posicionamiento: 'absolute top-4 right-4'
              // La 'X' se moverá al punto top-4 y right-4 de su contenedor 'relative' más cercano
              className='absolute top-4 right-4 text-white hover:text-gray-400 focus:outline-none p-1 rounded-full bg-white/10'
              aria-label="Cerrar modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
          </button>
          
            <button
              onClick={() => setActiveTab('card')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'card'
                  ? 'text-white border-b-2 border-cyan-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🎴 Nexus Card
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'email'
                  ? 'text-white border-b-2 border-cyan-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📧 Email Invitation
            </button>
            
            {/* Apply Code tab - only show if user hasn't applied a referral code yet */}
            {!account.referredBy && (
              <button
                onClick={() => setActiveTab('apply-code')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'apply-code'
                    ? 'text-white border-b-2 border-cyan-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🎁 Apply Code
              </button>
            )}

            {/* My Referrals tab */}
            <button
              onClick={() => setActiveTab('my-referrals')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'my-referrals'
                  ? 'text-white border-b-2 border-cyan-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              👥 My Referrals
            </button>
          </div>

          {/* Tab Content */}
          

{activeTab === 'email' ? (
    // CORRECCIÓN: Reintroducimos el JSX del formulario de Email que usa las variables del componente padre (email, isSending, etc.).
    <>
        {/* Referral Info */}
        <div className='bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 mb-6 border border-blue-400/30'>
            <div className='text-center'>
                <div className='text-lg font-bold text-white mb-2'>Your Referral Code</div>
                <div className='bg-yellow-400 text-black rounded-lg p-2 font-mono font-bold text-xl'>
                    {referralCode}
                </div>
                <div className='text-xs text-white/70 mt-2'>
                    Friends will get +25 XP bonus when they join!
                </div>
            </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSendInvitation} className='space-y-4'>
            {/* Email Input */}
            <div>
                <label htmlFor='email' className='block text-sm font-medium text-white mb-2'>
                    Friend's Email Address
                </label>
                <input
                    type='email'
                    id='email'
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder='friend@example.com'
                    className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300'
                    required
                    disabled={isSending}
                />
            </div>

            {/* Personal Message */}
            <div>
                <label htmlFor='message' className='block text-sm font-medium text-white mb-2'>
                    Personal Message (Optional)
                </label>
                <textarea
                    id='message'
                    value={personalMessage}
                    onChange={e => setPersonalMessage(e.target.value)}
                    placeholder='Hey! Join me on this amazing Web3 journey...'
                    rows={3}
                    className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none'
                    disabled={isSending}
                />
            </div>

            {/* Action Buttons */}
            <div className='flex gap-3 pt-4'>
                <button
                    type='submit'
                    disabled={isSending || !email.trim()}
                    className='flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2'
                >
                    {isSending ? (
                        <>
                            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                            <span>Sending...</span>
                        </>
                    ) : (
                        <>
                            <span>{emailJSService.isConfigured() ? '📧' : '📋'}</span>
                            <span>
                                {emailJSService.isConfigured() ? 'Send Invitation' : 'Copy Referral Link'}
                            </span>
                        </>
                    )}
                </button>
                <button
                    type='button'
                    onClick={handleClose}
                    disabled={isSending}
                    className='px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 border border-white/20 disabled:opacity-50'
                >
                    Cancel
                </button>
            </div>
        </form>
    </>

) : activeTab === 'apply-code' ? (
    // Apply Code tab - available for all users
    <ApplyCodeView 
      userWalletAddress={account.walletAddress}
      isAlreadyReferred={!!account.referredBy}
      onApplySuccess={(name, bonus) => {
        showBonusModal(name, bonus);
        onAccountUpdate(); 
      }}
    />
) : activeTab === 'my-referrals' ? (
    // My Referrals tab
    <MyReferralsView 
      referrerWalletAddress={account.walletAddress}
      referralCode={referralCode}
      referralLink={referralLink}
      referrerName={referrerName}
    />
) : (
    /* Card View (Incluir aquí las estadísticas del referidor) */
        <div className='flex justify-center'>
        <PokemonReferralCard account={account} />
        
        
        {account.stats.referralsCount !== undefined && account.stats.referralsCount > 0 && (
          <div className='mt-4 text-center text-white'>
              <h3 className='font-bold text-lg'>Stats de Referidos</h3>
              {/* Aquí ya no da error porque TypeScript SABE que el valor existe y es un número */}
              <p>Guest Friends: {account.stats.referralsCount}</p>
              <p>Bonus Points: {account.stats.totalReferralPoints}</p>
          </div>
        )}
    </div>
      
)}
        </div>
      </div>
    </div>
  );
};

export default ReferralInvitationModal;
