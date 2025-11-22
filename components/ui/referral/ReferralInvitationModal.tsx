'use client';

import React, { useState } from 'react';

import { UserAccount } from '@/utils/types/account'; // Importar el tipo correcto
import { useToast } from '@/contexts/ui/ToastContext';
import { emailJSService } from '@/lib/services/emailjs-service';
import { applyReferralCodeForExistingUser } from '@/lib/services/referral-service'; 
import { PokemonReferralCard } from './PokemonReferralCard';
import { Account } from '@/lib/firebase/firebase-types';

// 1. Definir el nuevo tipo de pestaña
type Tab = 'card' | 'email' | 'apply-code'; 

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
            <p className="text-white/70 text-sm">
                Enter your friend's 8-character code to receive your welcome bonus. 🎮
            </p>
            <input
                type='text'
                placeholder='FRIEND CODE (8 CHARACTERS)'
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().slice(0, 8))}
                maxLength={8}
               
                className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300'
                disabled={loading || isAlreadyReferred} 
            />

            <button
                onClick={handleApply}
                // Usa isAlreadyReferred, NO account.referredBy
                disabled={loading || code.length !== 8 || isAlreadyReferred} 
                className='w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition disabled:opacity-50'
            >
                {/* Usa isAlreadyReferred, NO account.referredBy */}
                {isAlreadyReferred 
                  ? 'Good code successfully applied!' 
                  : (loading ? 'Applying...' : 'Apply Code') 
                }
            </button>
            
            {statusMessage && <p className={`mt-3 text-sm font-medium ${statusMessage.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{statusMessage}</p>}
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

  if (!isOpen || !account) return null;

  // Generación de datos... (El código ya estaba correcto)
  const referralCode = account.referralCode || account.walletAddress.slice(-8).toUpperCase(); 
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;
  const referrerName = account?.profile?.displayName || 'Nexus Explorer';
  
  // Condición para mostrar la nueva pestaña: solo si el usuario aún NO tiene un referidor
  const showApplyCodeTab = !account?.referredBy;

  const handleSendInvitation = async (e: React.FormEvent) => {
    
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
              <button
                  onClick={onClose} // Llama a la prop de cierre
                  className='text-white hover:text-gray-400 focus:outline-none'
              >
                 
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
              </button>
          </div>
          <div className='flex border-b border-white/20 mb-6'>
            <button
              onClick={() => setActiveTab('card')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'card'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🎴 Nexus Card
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'email'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📧 Email Invitation
            </button>
            
            {/* 3. Botón de la nueva pestaña (APPLY CODE) */}
            {showApplyCodeTab && (
              <button
                onClick={() => setActiveTab('apply-code')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'apply-code'
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                ➕ Apply Code
              </button>
            )}
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
                    className='flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2'
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

) : activeTab === 'apply-code' && showApplyCodeTab ? (
    // 4. Nuevo contenido de la pestaña APPLY CODE
    <ApplyCodeView 
      userWalletAddress={account.walletAddress}
      isAlreadyReferred={!!account.referredBy}
      onApplySuccess={(name, bonus) => {
        showBonusModal(name, bonus);
        onAccountUpdate(); 
      }}
    />
) : (
    /* Card View (Incluir aquí las estadísticas del referidor) */
        <div className='flex justify-center'>
        <PokemonReferralCard account={account} />
        
        
        {account.stats.referralsCount !== undefined && account.stats.referralsCount > 0 && (
          <div className='mt-4 text-center text-white'>
              <h3 className='font-bold text-lg'>Stats de Referidos</h3>
              {/* Aquí ya no da error porque TypeScript SABE que el valor existe y es un número */}
              <p>Amigos Invitados: {account.stats.referralsCount}</p>
              <p>Puntos de Bono: {account.stats.totalReferralPoints}</p>
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