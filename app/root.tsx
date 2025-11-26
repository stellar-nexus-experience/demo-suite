'use client';

import { ReactNode } from 'react';
import { TransactionProvider } from '@/contexts/data/TransactionContext';
import { ToastProvider } from '@/contexts/ui/ToastContext';
import { BadgeAnimationProvider } from '@/contexts/ui/BadgeAnimationContext';
import { WalletProvider } from '@/contexts/wallet/WalletContext';
import { AuthProvider } from '@/contexts/auth/AuthContext';
import { AccountProvider } from '@/contexts/auth/AccountContext';
import { NetworkProvider } from '@/contexts/wallet/NetworkContext';
import { FirebaseProvider } from '@/contexts/data/FirebaseContext';
import { EscrowProvider } from '@/contexts/data/EscrowContext';
import { ExtensionErrorHandler } from '@/components/utils/ExtensionErrorHandler';

interface RootProvidersProps {
  children: ReactNode;
}

export const RootProviders = ({ children }: RootProvidersProps) => {
  return (
    <>
      <ExtensionErrorHandler />
      <WalletProvider>
        <NetworkProvider>
          <AuthProvider>
            <ToastProvider>
              <AccountProvider>
                <TransactionProvider>
                  <FirebaseProvider>
                    <BadgeAnimationProvider>
                      <EscrowProvider>{children}</EscrowProvider>
                    </BadgeAnimationProvider>
                  </FirebaseProvider>
                </TransactionProvider>
              </AccountProvider>
            </ToastProvider>
          </AuthProvider>
        </NetworkProvider>
      </WalletProvider>
    </>
  );
};
