'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useFirebase } from './FirebaseContext';
import { useGlobalWallet } from '../wallet/WalletContext';
import { accountService } from '@/lib/firebase/firebase-service';
import { TransactionRecord } from '@/lib/firebase/firebase-types';

export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  message: string;
  timestamp: Date;
  type: 'escrow' | 'milestone' | 'fund' | 'approve' | 'release' | 'dispute' | 'demo_completion' | 'badge_earned';
  demoId?: string;
  amount?: string;
  asset?: string;
  explorerUrl?: string;
  stellarExpertUrl?: string;
  points?: number;
  badgeId?: string;
}


export function cleanObject<T extends Record<string, any>>(obj: T): T {
  const newObj = { ...obj };
  Object.keys(newObj).forEach(key => {
    // Si el valor es estrictamente undefined, elimínalo del objeto
    if (newObj[key] === undefined) {
      delete newObj[key];
    }
  });
  return newObj;
}



interface TransactionContextType {
  transactions: TransactionStatus[];
  addTransaction: (transaction: Omit<TransactionStatus, 'timestamp'>) => Promise<TransactionStatus>;
  updateTransaction: (hash: string, status: 'success' | 'failed', message: string) => Promise<void>;
  clearTransactions: () => void;
  getTransactionsByDemo: (demoId: string) => TransactionStatus[];
  getRecentTransactions: (limit?: number) => TransactionStatus[];
  getTransactionsByType: (type: TransactionStatus['type']) => TransactionStatus[];
  isLoading: boolean;
  refreshTransactions: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransactionHistory = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactionHistory must be used within a TransactionProvider');
  }
  return context;
};

interface TransactionProviderProps {
  children: ReactNode;
}

export const TransactionProvider = ({ children }: TransactionProviderProps) => {
  const [transactions, setTransactions] = useState<TransactionStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { walletData } = useGlobalWallet();

  const refreshTransactions = useCallback(async () => {
    if (!walletData?.publicKey) return;

    setIsLoading(true);
    try {
      const firebaseTransactions = await accountService.getUserTransactions(walletData.publicKey);
      const formattedTransactions = firebaseTransactions.map((tx: TransactionRecord) => ({
        hash: tx.hash,
        status: tx.status,
        message: tx.message,
        timestamp: tx.timestamp instanceof Date ? tx.timestamp : new Date(tx.timestamp),
        type: tx.type,
        demoId: tx.demoId,
        amount: tx.amount,
        asset: tx.asset,
        explorerUrl: tx.explorerUrl,
        stellarExpertUrl: tx.stellarExpertUrl,
        points: tx.points,
        badgeId: tx.badgeId,
      }));
      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Failed to refresh transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [walletData?.publicKey]);

  // Load transactions when wallet connects
  useEffect(() => {
    if (walletData?.publicKey) {
      refreshTransactions();
    } else {
      setTransactions([]);
    }
  }, [walletData?.publicKey, refreshTransactions]);

  const addTransaction = async (transaction: Omit<TransactionStatus, 'timestamp'>): Promise<TransactionStatus> => {
    const newTransaction: TransactionStatus = {
      ...transaction,
      timestamp: new Date(),
    };

    // Add to local state immediately for responsiveness
    setTransactions(prev => [newTransaction, ...prev]);

    // Persist to Firebase
     if (walletData?.publicKey) {
  try {
    const rawPayload = {
      id: newTransaction.hash,
      hash: newTransaction.hash,
      status: newTransaction.status,
      message: newTransaction.message,
      type: newTransaction.type,
      demoId: newTransaction.demoId,
      amount: newTransaction.amount,
      asset: newTransaction.asset,
      explorerUrl: newTransaction.explorerUrl,
      stellarExpertUrl: newTransaction.stellarExpertUrl,
      points: newTransaction.points,
      badgeId: newTransaction.badgeId,
    };

    // ⬇️ APLICA LA LIMPIEZA AQUÍ ⬇️
    const transactionPayload = cleanObject(rawPayload); 
    
    await accountService.addTransaction(walletData.publicKey, transactionPayload);
  } catch (error) {
    console.error('Failed to save transaction to Firebase:', error);
  }
}

    return newTransaction;
  };

  const updateTransaction = async (hash: string, status: 'success' | 'failed', message: string) => {
    // Update local state immediately
    setTransactions(prev => prev.map(tx => (tx.hash === hash ? { ...tx, status, message } : tx)));

    // Update in Firebase
    if (walletData?.publicKey) {
      try {
        await accountService.updateTransaction(walletData.publicKey, hash, status, message);
      } catch (error) {
        console.error('Failed to update transaction in Firebase:', error);
      }
    }
  };

  const clearTransactions = () => {
    setTransactions([]);
  };

  const getTransactionsByDemo = (demoId: string) => {
    return transactions.filter(tx => tx.demoId === demoId);
  };

  const getRecentTransactions = (limit: number = 10) => {
    return transactions.slice(0, limit);
  };

  const getTransactionsByType = (type: TransactionStatus['type']) => {
    return transactions.filter(tx => tx.type === type);
  };

  const value: TransactionContextType = {
    transactions,
    addTransaction,
    updateTransaction,
    clearTransactions,
    getTransactionsByDemo,
    getRecentTransactions,
    getTransactionsByType,
    isLoading,
    refreshTransactions,
  };

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
};
