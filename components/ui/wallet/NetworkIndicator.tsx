'use client';

import React, { useState } from 'react';
import { useGlobalWallet } from '@/contexts/wallet/WalletContext';

interface NetworkIndicatorProps {
  className?: string;
  showSwitchButton?: boolean;
}

export const NetworkIndicator: React.FC<NetworkIndicatorProps> = ({
  className = '',
  showSwitchButton = true,
}) => {
  const { currentNetwork, walletData, switchNetwork, isConnected } = useGlobalWallet();
  const [isSwitching, setIsSwitching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const isMainnet = walletData?.isMainnet || currentNetwork === 'PUBLIC';

  const handleNetworkSwitch = async (network: 'TESTNET' | 'PUBLIC') => {
    if (network === currentNetwork) return;

    setIsSwitching(true);
    try {
      await switchNetwork(network);
      setShowDropdown(false);
    } catch (error) {
      console.error('Error switching network:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  const getNetworkDisplayInfo = () => {
    if (isMainnet) {
      return {
        name: 'Mainnet',
        shortName: 'MAIN',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-400/30',
        icon: '🌐',
        description: 'Public Stellar Network',
      };
    } else {
      return {
        name: 'Testnet',
        shortName: 'TEST',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-400/30',
        icon: '🧪',
        description: 'Stellar Test Network',
      };
    }
  };

  const networkInfo = getNetworkDisplayInfo();

  if (!isConnected) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 ${networkInfo.bgColor} ${networkInfo.borderColor} ${networkInfo.color} hover:bg-opacity-30 cursor-pointer ${showSwitchButton ? 'hover:shadow-lg' : ''}`}
        onClick={() => showSwitchButton && setShowDropdown(!showDropdown)}
      >
        <span className='text-lg'>{networkInfo.icon}</span>
        <div className='flex flex-col'>
          <span className='text-sm font-medium'>{networkInfo.name}</span>
          <span className='text-xs opacity-75'>{networkInfo.description}</span>
          {walletData?.walletName && (
            <span className='text-xs opacity-60'>via {walletData.walletName}</span>
          )}
        </div>
        {showSwitchButton && (
          <div className='ml-2'>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </div>
        )}
      </div>

      {showDropdown && showSwitchButton && (
        <div className='absolute top-full left-0 mt-2 w-64 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl z-50'>
          <div className='p-4'>
            <h3 className='text-white font-semibold mb-3'>Switch Network</h3>

            <div className='mb-3'>
              <div
                className={`p-3 rounded-lg border ${networkInfo.bgColor} ${networkInfo.borderColor}`}
              >
                <div className='flex items-center space-x-3'>
                  <span className='text-lg'>{networkInfo.icon}</span>
                  <div>
                    <div className={`font-medium ${networkInfo.color}`}>{networkInfo.name}</div>
                    <div className='text-xs text-white/70'>Currently Connected</div>
                    {walletData?.walletName && (
                      <div className='text-xs text-white/60'>via {walletData.walletName}</div>
                    )}
                  </div>
                  <div className='ml-auto'>
                    <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
                  </div>
                </div>
              </div>
            </div>

            <div className='space-y-2'>
              {currentNetwork !== 'TESTNET' && (
                <button
                  onClick={() => handleNetworkSwitch('TESTNET')}
                  disabled={isSwitching}
                  className='w-full p-3 rounded-lg border border-white/10 hover:border-yellow-400/30 hover:bg-yellow-500/10 transition-all duration-200 text-left disabled:opacity-50'
                >
                  <div className='flex items-center space-x-3'>
                    <span className='text-lg'>🧪</span>
                    <div>
                      <div className='text-white font-medium'>Testnet</div>
                      <div className='text-xs text-white/70'>Stellar Test Network</div>
                    </div>
                    {isSwitching && currentNetwork === 'TESTNET' && (
                      <div className='ml-auto'>
                        <div className='w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin'></div>
                      </div>
                    )}
                  </div>
                </button>
              )}

              {currentNetwork !== 'PUBLIC' && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Disabled: mainnet not available in demo
                  }}
                  disabled={true}
                  className='w-full p-3 rounded-lg border border-white/10 bg-white/5 text-left opacity-60 cursor-not-allowed'
                  title='Coming soon: Mainnet support is disabled for safety'
                >
                  <div className='flex items-center space-x-3'>
                    <span className='text-lg'>🌐</span>
                    <div>
                      <div className='text-white font-medium flex items-center space-x-2'>
                        <span>Mainnet</span>
                        <span className='px-1.5 py-0.5 text-[10px] rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'>Coming Soon</span>
                      </div>
                      <div className='text-xs text-white/70'>Public Stellar Network</div>
                    </div>
                  </div>
                </button>
              )}
            </div>

            {isMainnet && (
              <div className='mt-3 p-2 bg-red-500/20 border border-red-400/30 rounded-lg'>
                <div className='flex items-center space-x-2'>
                  <span className='text-red-400'>⚠️</span>
                  <span className='text-xs text-red-300'>
                    You're on Mainnet. Real funds are at risk.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showDropdown && (
        <div className='fixed inset-0 z-40' onClick={() => setShowDropdown(false)} />
      )}
    </div>
  );
};

export default NetworkIndicator;
