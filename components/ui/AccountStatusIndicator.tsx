'use client';

import React, { useState, useEffect } from 'react';
import { useFirebase } from '@/contexts/data/FirebaseContext';
import { useGlobalWallet } from '@/contexts/wallet/WalletContext';
import { LoadingSpinner } from './common/LoadingSpinner';

export const AccountStatusIndicator: React.FC = () => {
  const { account, isLoading } = useFirebase();
  const { isConnected, isLoading: walletLoading } = useGlobalWallet();
  const [showAccountReady, setShowAccountReady] = useState(false);
  const [progress, setProgress] = useState(100);
  const [loadingMessage, setLoadingMessage] = useState('Connecting wallet...');

  // Update loading message based on current state
  useEffect(() => {
    if (walletLoading) {
      setLoadingMessage('Connecting wallet...');
    } else if (isLoading && isConnected && !account) {
      setLoadingMessage('Loading account data...');
    } else if (isLoading && isConnected && account) {
      setLoadingMessage('Syncing account...');
    }
  }, [walletLoading, isLoading, isConnected, account]);

  // Show account ready notification when account is first created/loaded
  useEffect(() => {
    if (account && !isLoading && !walletLoading) {
      setShowAccountReady(true);
      setProgress(100);

      // Start progress countdown
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - 1;
          if (newProgress <= 0) {
            clearInterval(interval);
            setTimeout(() => setShowAccountReady(false), 100);
            return 0;
          }
          return newProgress;
        });
      }, 100); // Update every 100ms for smooth animation (10 seconds total)

      return () => clearInterval(interval);
    }
  }, [account, isLoading, walletLoading]);

  const handleClose = () => {
    setShowAccountReady(false);
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className='fixed top-20 right-4 z-40'>
      {(walletLoading || (isLoading && !account)) && (
        <div className='bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 min-w-[240px]'>
          <LoadingSpinner size='sm' variant='white' />
          <div className='flex-1'>
            <div className='text-sm font-medium'>{loadingMessage}</div>
            <div className='text-xs opacity-90 mt-1'>
              {walletLoading ? 'Please wait...' : 'Setting up your account...'}
            </div>
          </div>
        </div>
      )}

      {isLoading && account && (
        <div className='bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 min-w-[240px]'>
          <LoadingSpinner size='sm' variant='white' />
          <div className='flex-1'>
            <div className='text-sm font-medium'>Syncing account...</div>
            <div className='text-xs opacity-90 mt-1'>Updating your progress</div>
          </div>
        </div>
      )}

      {account && showAccountReady && !isLoading && !walletLoading && (
        <div className='bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-lg animate-fade-in relative overflow-hidden min-w-[280px]'>
          {/* Progress bar background */}
          <div className='absolute bottom-0 left-0 h-1 bg-green-800 w-full'>
            <div
              className='h-full bg-green-300 transition-all duration-100 ease-linear'
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content */}
          <div className='flex items-center justify-between p-4'>
            <div className='flex items-center space-x-3'>
              <div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center'>
                <span className='text-sm'>✅</span>
              </div>
              <div className='text-sm'>
                <div className='font-medium'>Account Ready</div>
                <div className='text-xs opacity-90'>
                  {account.totalPoints || 0} points • Level{' '}
                  {Math.floor((account.experience || 0) / 1000) + 1}
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className='ml-3 text-white hover:text-green-200 transition-colors p-1 rounded hover:bg-green-700'
              title='Close'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
