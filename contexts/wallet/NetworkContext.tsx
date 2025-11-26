'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useGlobalWallet } from './WalletContext';

interface NetworkContextType {
  currentNetwork: string;
  isMainnet: boolean;
  networkPassphrase: string;
  horizonUrl: string;
  networkConfig: {
    name: string;
    shortName: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
    description: string;
  };
  switchNetwork: (network: 'TESTNET' | 'PUBLIC') => Promise<void>;
  detectNetworkChange: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider = ({ children }: NetworkProviderProps) => {
  const { currentNetwork, walletData, switchNetwork, detectNetworkChange } = useGlobalWallet();
  const [networkConfig, setNetworkConfig] = useState({
    name: 'Testnet',
    shortName: 'TEST',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-400/30',
    icon: '🧪',
    description: 'Stellar Test Network',
  });

  const isMainnet = walletData?.isMainnet || currentNetwork === 'PUBLIC';
  const networkPassphrase = walletData?.networkPassphrase || 'Test SDF Network ; September 2015';
  const horizonUrl = walletData?.horizonUrl || 'https://horizon-testnet.stellar.org';

  // Update network config when network changes
  useEffect(() => {
    if (isMainnet) {
      setNetworkConfig({
        name: 'Mainnet',
        shortName: 'MAIN',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-400/30',
        icon: '🌐',
        description: 'Public Stellar Network',
      });
    } else {
      setNetworkConfig({
        name: 'Testnet',
        shortName: 'TEST',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-400/30',
        icon: '🧪',
        description: 'Stellar Test Network',
      });
    }
  }, [isMainnet]);

  // Listen for network change events
  useEffect(() => {
    const handleNetworkChange = () => {
      // The wallet context will handle the actual state updates
    };

    window.addEventListener('networkChanged', handleNetworkChange as EventListener);

    return () => {
      window.removeEventListener('networkChanged', handleNetworkChange as EventListener);
    };
  }, []);

  const value: NetworkContextType = {
    currentNetwork,
    isMainnet,
    networkPassphrase,
    horizonUrl,
    networkConfig,
    switchNetwork,
    detectNetworkChange,
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};
