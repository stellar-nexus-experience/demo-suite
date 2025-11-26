'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useWallet } from '@/lib/stellar/stellar-wallet-hooks';

interface WalletContextType {
  walletData: any;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  connect: (walletId?: string) => Promise<void>;
  connectFreighter: () => Promise<void>;
  connectManualAddress: (address: string) => Promise<void>;
  disconnect: () => Promise<void>;
  isFreighterAvailable: boolean;
  currentNetwork: string;
  switchNetwork: (network: 'TESTNET' | 'PUBLIC') => Promise<void>;
  detectNetworkChange: () => Promise<void>;
  openWalletModal: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useGlobalWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useGlobalWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const walletHook = useWallet();

  // Share the wallet state globally
  const value: WalletContextType = {
    walletData: walletHook.walletData,
    isConnected: walletHook.isConnected,
    isLoading: walletHook.isLoading,
    error: walletHook.error,
    connect: walletHook.connect,
    connectFreighter: walletHook.connectFreighter,
    connectManualAddress: walletHook.connectManualAddress,
    disconnect: walletHook.disconnect,
    isFreighterAvailable: walletHook.isFreighterAvailable,
    currentNetwork: walletHook.currentNetwork,
    switchNetwork: walletHook.switchNetwork,
    detectNetworkChange: walletHook.detectNetworkChange,
    openWalletModal: walletHook.openWalletModal,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
