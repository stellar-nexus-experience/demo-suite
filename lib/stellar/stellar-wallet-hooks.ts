import { useState, useEffect, useCallback, useRef } from 'react';
import { SendTransactionResponse } from '@/utils/types/trustless-work';
import { stellarConfig, assetConfig } from './wallet-config';
import { validateStellarAddress } from './stellar-address-validation';
import { NETWORK_CONFIGS } from '@/utils/constants/network';
import {
  StellarWalletsKit,
  WalletNetwork,
  FreighterModule,
  AlbedoModule,
  RabetModule,
  LobstrModule,
  ISupportedWallet,
} from '@creit.tech/stellar-wallets-kit';

// Singleton to prevent multiple initializations
let globalWalletKit: StellarWalletsKit | null = null;
let isInitializing = false;

// POC Mode - No Stellar Wallets Kit initialization to avoid custom element conflicts
const POC_MODE = process.env.NODE_ENV === 'development';

// Network configurations are now imported from constants

// Helper function to get network configuration
const getNetworkConfig = (network: string) => {
  return NETWORK_CONFIGS[network as keyof typeof NETWORK_CONFIGS] || NETWORK_CONFIGS.TESTNET;
};

export interface WalletData {
  publicKey: string;
  network: string;
  isConnected: boolean;
  networkPassphrase: string;
  horizonUrl: string;
  isMainnet: boolean;
  walletName: string;
  walletType: string;
  walletId: string;
  walletIcon?: string;
  walletUrl?: string;
}

export interface UseWalletReturn {
  walletData: WalletData | null;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  connect: (walletId?: string) => Promise<void>;
  connectFreighter: () => Promise<void>;
  connectManualAddress: (address: string) => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<{ signedTxXdr: string; signerAddress?: string }>;
  sendTransaction: (signedXdr: string) => Promise<SendTransactionResponse>;
  getAvailableWallets: () => Promise<ISupportedWallet[]>;
  isFreighterAvailable: boolean;
  currentNetwork: string;
  switchNetwork: (network: 'TESTNET' | 'PUBLIC') => Promise<void>;
  detectNetworkChange: () => Promise<void>;
  walletKit: StellarWalletsKit | null;
  openWalletModal: () => Promise<void>;
}

export const useWallet = (): UseWalletReturn => {
  // Initialize from localStorage if available
  const [walletData, setWalletData] = useState<WalletData | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stellar-wallet-data');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isFreighterAvailable, setIsFreighterAvailable] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState<string>('TESTNET');
  const [walletKit, setWalletKit] = useState<StellarWalletsKit | null>(null);
  const [availableWallets, setAvailableWallets] = useState<ISupportedWallet[]>([]);

  // Use refs to prevent repeated checks
  const hasCheckedFreighter = useRef(false);
  const checkInterval = useRef<NodeJS.Timeout | null>(null);

  // Persist wallet data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (walletData) {
        localStorage.setItem('stellar-wallet-data', JSON.stringify(walletData));
      } else {
        localStorage.removeItem('stellar-wallet-data');
      }
    }
  }, [walletData]);

  // Periodic Freighter availability check
  useEffect(() => {
    const checkFreighterPeriodically = () => {
      if (typeof window !== 'undefined') {
        const freighterAvailable = !!(window as any).stellar || !!(window as any).freighter;
        if (freighterAvailable !== isFreighterAvailable) {
          setIsFreighterAvailable(freighterAvailable);
        }
      }
    };

    // Check every 2 seconds for Freighter availability
    const interval = setInterval(checkFreighterPeriodically, 2000);

    return () => clearInterval(interval);
  }, [isFreighterAvailable]);

  // Initialize Stellar Wallets Kit
  useEffect(() => {
    const initializeWalletKit = async () => {
      try {
        // Use singleton pattern to prevent multiple initializations
        if (globalWalletKit) {
          setWalletKit(globalWalletKit);
          const supportedWallets = await globalWalletKit.getSupportedWallets();
          setAvailableWallets(supportedWallets);
          
          // If we have saved wallet data, try to reconnect
          if (walletData?.isConnected) {
            await checkConnectionStatus(globalWalletKit);
          }
          return;
        }

        if (isInitializing) {
          return;
        }

        isInitializing = true;

        // Check if custom elements are already defined (prevents HMR issues)
        const customElementsToCheck = [
          'stellar-wallets-modal',
          'stellar-wallets-button',
          'stellar-accounts-selector',
        ];
        const alreadyDefined = customElementsToCheck.some(name => customElements.get(name));

        if (alreadyDefined) {
          isInitializing = false;
          return;
        }

        // Create wallet modules
        const modules = [
          new FreighterModule(),
          new AlbedoModule(),
          new RabetModule(),
          new LobstrModule(),
        ];

        // Initialize the kit
        const kit = new StellarWalletsKit({
          network: WalletNetwork.TESTNET,
          modules,
        });

        // Store globally to prevent re-initialization
        globalWalletKit = kit;

        setWalletKit(kit);

        // Get available wallets
        const supportedWallets = await kit.getSupportedWallets();
        setAvailableWallets(supportedWallets);

        // Check if Freighter is available
        const freighterWallet = supportedWallets.find(wallet => wallet.id === 'freighter');
        const freighterAvailable = freighterWallet?.isAvailable || false;
        setIsFreighterAvailable(freighterAvailable);

        // Check if already connected OR if we have saved wallet data
        await checkConnectionStatus(kit);
        isInitializing = false;
      } catch (error) {
        isInitializing = false;

        // Fallback to direct Freighter detection
        const freighterDetected =
          typeof window !== 'undefined' && ((window as any).stellar || (window as any).freighter);
        setIsFreighterAvailable(freighterDetected);

        // Freighter availability is set above
      }
    };

    const checkConnectionStatus = async (kit: StellarWalletsKit) => {
      try {
        // Try to get address to check if already connected
        const addressResponse = await kit.getAddress();
        if (addressResponse.address) {
          // Get network info
          const networkResponse = await kit.getNetwork();

          setCurrentNetwork(networkResponse.network);

          const networkConfig = getNetworkConfig(networkResponse.network);

          // Get wallet info from the kit's selected module
          const selectedModule = kit['selectedModule'];
          const connectedWallet = selectedModule
            ? {
                id: selectedModule.productId,
                name: selectedModule.productName,
                type: 'unknown',
                icon: selectedModule.productIcon,
                url: selectedModule.productUrl,
              }
            : null;

          const newWalletData = {
            publicKey: addressResponse.address,
            network: networkResponse.network,
            isConnected: true,
            networkPassphrase: networkResponse.networkPassphrase,
            horizonUrl: networkConfig.horizonUrl,
            isMainnet: networkConfig.isMainnet,
            walletName: connectedWallet?.name || 'Unknown Wallet',
            walletType: connectedWallet?.type || 'unknown',
            walletId: connectedWallet?.id || 'unknown',
            walletIcon: connectedWallet?.icon,
            walletUrl: connectedWallet?.url,
          };
          
          setWalletData(newWalletData);
          
          // Persist to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('stellar-wallet-data', JSON.stringify(newWalletData));
          }
        }
      } catch (error) {
        // Connection check failed, check if we have saved data
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('stellar-wallet-data');
          if (saved) {
            try {
              const savedData = JSON.parse(saved);
              // Don't mark as connected if check failed, but keep the data
            } catch (e) {
              // Failed to parse saved wallet data
            }
          }
        }
        // Failed to check connection status
      }
    };

    initializeWalletKit();

    // Cleanup function to prevent memory leaks
    return () => {
      if (walletKit) {
        // The StellarWalletsKit doesn't have a cleanup method, but we can clear our state
        setWalletKit(null);
        setAvailableWallets([]);
      }
    };
  }, []);

  const connect = useCallback(
    async (walletId?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // Ensure we have a wallet kit available
        let currentKit = walletKit || globalWalletKit;

        // If no kit is available, try to initialize one
        if (!currentKit && !isInitializing) {
          try {
            const modules = [
              new FreighterModule(),
              new AlbedoModule(),
              new RabetModule(),
              new LobstrModule(),
            ];

            currentKit = new StellarWalletsKit({
              network: WalletNetwork.TESTNET,
              modules,
            });

            globalWalletKit = currentKit;
            setWalletKit(currentKit);
          } catch (initError) {
            // Wallet kit initialization failed, continue without kit
          }
        }

        // Try Stellar Wallets Kit first
        if (currentKit) {
          try {
            // If walletId is provided, set the wallet
            if (walletId) {
              currentKit.setWallet(walletId);
            } else {
              // If no walletId provided, try to use the first available wallet
              const supportedWallets = await currentKit.getSupportedWallets();
              const availableWallet = supportedWallets.find(w => w.isAvailable);

              if (!availableWallet) {
                throw new Error(
                  'No wallet available. Please install a Stellar wallet like Freighter.'
                );
              }

              currentKit.setWallet(availableWallet.id);
            }

            // Get wallet information
            const addressResponse = await currentKit.getAddress();
            const networkResponse = await currentKit.getNetwork();

            setCurrentNetwork(networkResponse.network);

            const networkConfig = getNetworkConfig(networkResponse.network);

            // Get wallet info from the kit's selected module
            const selectedModule = currentKit['selectedModule'];
            const connectedWallet = selectedModule
              ? {
                  id: selectedModule.productId,
                  name: selectedModule.productName,
                  type: 'unknown',
                  icon: selectedModule.productIcon,
                  url: selectedModule.productUrl,
                }
              : null;

            setWalletData({
              publicKey: addressResponse.address,
              network: networkResponse.network,
              isConnected: true,
              networkPassphrase: networkResponse.networkPassphrase,
              horizonUrl: networkConfig.horizonUrl,
              isMainnet: networkConfig.isMainnet,
              walletName: connectedWallet?.name || 'Unknown Wallet',
              walletType: connectedWallet?.type || 'unknown',
              walletId: connectedWallet?.id || 'unknown',
              walletIcon: connectedWallet?.icon,
              walletUrl: connectedWallet?.url,
            });
            return;
          } catch (kitError) {
            // Kit connection failed, continue to fallback
          }
        }

        // Fallback to direct Freighter API
        if (
          typeof window !== 'undefined' &&
          ((window as any).stellar || (window as any).freighter)
        ) {
          const stellar = (window as any).stellar || (window as any).freighter;

          // Request access to Freighter
          await stellar.requestAccess();

          // Get wallet information
          const publicKey = await stellar.getPublicKey();
          const network = await stellar.getNetwork();

          setCurrentNetwork(network);

          const networkConfig = getNetworkConfig(network);
          setWalletData({
            publicKey,
            network,
            isConnected: true,
            networkPassphrase: networkConfig.passphrase,
            horizonUrl: networkConfig.horizonUrl,
            isMainnet: networkConfig.isMainnet,
            walletName: 'Freighter',
            walletType: 'freighter',
            walletId: 'freighter',
          });
        } else {
          throw new Error('No wallet available. Please install Freighter browser extension.');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        const error = new Error(`Failed to connect wallet: ${errorMessage}`);
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [walletKit]
  );

  const connectFreighter = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Enhanced Freighter detection
      const isFreighterAvailable = () => {
        if (typeof window === 'undefined') return false;

        // Check multiple possible ways Freighter might be available
        const stellar = (window as any).stellar;
        const freighter = (window as any).freighter;

        return !!(stellar || freighter);
      };

      if (!isFreighterAvailable()) {
        throw new Error('Freighter wallet not detected. Please install Freighter extension.');
      }

      // Try to get the stellar object from window
      const stellar = (window as any).stellar || (window as any).freighter;

      if (!stellar) {
        throw new Error(
          'Freighter API not accessible. Please ensure the extension is properly installed and enabled.'
        );
      }

      // Request access to Freighter
      await stellar.requestAccess();

      // Get public key
      const publicKey = await stellar.getPublicKey();

      // Get network
      const network = await stellar.getNetwork();
      setCurrentNetwork(network);

      const networkConfig = getNetworkConfig(network);

      setWalletData({
        publicKey,
        network,
        isConnected: true,
        networkPassphrase: networkConfig.passphrase,
        horizonUrl: networkConfig.horizonUrl,
        isMainnet: networkConfig.isMainnet,
        walletName: 'Freighter',
        walletType: 'freighter',
        walletId: 'freighter',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      const error = new Error(`Failed to connect Freighter: ${errorMessage}`);
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connectManualAddress = useCallback(async (address: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // For manual addresses, we'll simulate a connection by setting the wallet data directly
      // This is useful for testing or when users want to use a specific address
      const network = 'TESTNET'; // Default to testnet for manual addresses
      setCurrentNetwork(network);

      const networkConfig = getNetworkConfig(network);
      setWalletData({
        publicKey: address,
        network,
        isConnected: true,
        networkPassphrase: networkConfig.passphrase,
        horizonUrl: networkConfig.horizonUrl,
        isMainnet: networkConfig.isMainnet,
        walletName: 'Manual Address',
        walletType: 'manual',
        walletId: 'manual',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      const error = new Error(`Failed to connect manual address: ${errorMessage}`);
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const currentKit = walletKit || globalWalletKit;
      if (currentKit) {
        await currentKit.disconnect();
      }
      setWalletData(null);
      
      // Clear all localStorage wallet data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('wallet-connected-before');
        localStorage.removeItem('stellar-wallet-data');
      }
    } catch (err) {}
  }, [walletKit]);

  const signTransaction = useCallback(
    async (xdr: string) => {
      const currentKit = walletKit || globalWalletKit;
      if (!currentKit || !walletData) {
        throw new Error('Wallet not connected');
      }

      try {
        const result = await currentKit.signTransaction(xdr, {
          networkPassphrase: walletData.networkPassphrase,
          address: walletData.publicKey,
        });

        return result;
      } catch (err) {
        throw err;
      }
    },
    [walletKit, walletData]
  );

  const sendTransaction = useCallback(
    async (signedXdr: string) => {
      // Mock implementation for POC
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const hash = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const contractId = `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return {
          success: true,
          hash,
          status: 'success',
          message: 'Transaction successful (POC)',
          contractId,
          escrow: {
            id: contractId,
            type: 'multi-release',
            asset: {
              code: assetConfig.defaultAsset.code,
              issuer: assetConfig.defaultAsset.issuer,
              decimals: assetConfig.defaultAsset.decimals,
            },
            amount: '1000000',
            platformFee: assetConfig.platformFee,
            buyer: walletData?.publicKey || '',
            seller: walletData?.publicKey || '',
            arbiter: walletData?.publicKey || '',
            terms: 'POC escrow contract',
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            releases: [
              {
                id: `release_${Date.now()}_1`,
                amount: '1000000',
                status: 'pending' as const,
                createdAt: new Date().toISOString(),
              },
            ],
            metadata: {
              description: 'POC escrow contract',
              category: 'demo',
            },
          },
        };
      } catch (err) {
        return {
          success: false,
          status: 'error',
          message: 'Failed to send transaction',
          contractId: '',
          escrow: null,
        };
      }
    },
    [walletData?.publicKey]
  );

  const getAvailableWallets = useCallback(async () => {
    const currentKit = walletKit || globalWalletKit;
    if (!currentKit) {
      return [];
    }

    try {
      const supportedWallets = await currentKit.getSupportedWallets();
      return supportedWallets;
    } catch (error) {
      return [];
    }
  }, [walletKit]);

  // Network detection function
  const detectNetworkChange = useCallback(async () => {
    const currentKit = walletKit || globalWalletKit;
    if (!currentKit || !walletData) {
      return;
    }

    try {
      // Get current network from wallet kit
      const networkResponse = await currentKit.getNetwork();

      if (networkResponse.network !== currentNetwork) {
        setCurrentNetwork(networkResponse.network);

        // Update wallet data with new network info
        const networkConfig = getNetworkConfig(networkResponse.network);
        setWalletData(prev =>
          prev
            ? {
                ...prev,
                network: networkResponse.network,
                networkPassphrase: networkResponse.networkPassphrase,
                horizonUrl: networkConfig.horizonUrl,
                isMainnet: networkConfig.isMainnet,
              }
            : null
        );

        // Dispatch custom event for other components to listen
        window.dispatchEvent(
          new CustomEvent('networkChanged', {
            detail: {
              network: networkResponse.network,
              isMainnet: networkConfig.isMainnet,
              horizonUrl: networkConfig.horizonUrl,
            },
          })
        );
      }
    } catch (err) {}
  }, [walletKit, walletData, currentNetwork]);

  // Network switching function
  const switchNetwork = useCallback(
    async (network: 'TESTNET' | 'PUBLIC') => {
      // Enforce TESTNET-only mode for safety during demos
      if (network === 'PUBLIC') {
        throw new Error('Mainnet is disabled in demo mode. Please use TESTNET.');
      }
      if (!walletKit || !walletData) {
        throw new Error('No wallet connected');
      }

      try {
        // Update the wallet kit network
        const walletNetwork = network === 'TESTNET' ? WalletNetwork.TESTNET : WalletNetwork.PUBLIC;

        // Create new kit instance with updated network
        const modules = [
          new FreighterModule(),
          new AlbedoModule(),
          new RabetModule(),
          new LobstrModule(),
        ];

        const newKit = new StellarWalletsKit({
          network: walletNetwork,
          modules,
        });

        setWalletKit(newKit);
        setCurrentNetwork(network);

        // Update wallet data
        const networkConfig = getNetworkConfig(network);
        setWalletData({
          ...walletData,
          network,
          networkPassphrase: networkConfig.passphrase,
          horizonUrl: networkConfig.horizonUrl,
          isMainnet: networkConfig.isMainnet,
        });

        // Dispatch custom event
        window.dispatchEvent(
          new CustomEvent('networkChanged', {
            detail: {
              network,
              isMainnet: networkConfig.isMainnet,
              horizonUrl: networkConfig.horizonUrl,
            },
          })
        );
      } catch (err) {
        throw err;
      }
    },
    [walletKit, walletData]
  );

  // Open wallet modal function
  const openWalletModal = useCallback(async () => {
    let currentKit = walletKit || globalWalletKit;
    
    // If kit is not initialized, try to initialize it now
    if (!currentKit && !isInitializing) {
      try {
        isInitializing = true;
        
        // Create wallet modules
        const modules = [
          new FreighterModule(),
          new AlbedoModule(),
          new RabetModule(),
          new LobstrModule(),
        ];

        // Initialize the kit
        currentKit = new StellarWalletsKit({
          network: WalletNetwork.TESTNET,
          modules,
        });

        // Store globally to prevent re-initialization
        globalWalletKit = currentKit;
        setWalletKit(currentKit);
        
        isInitializing = false;
      } catch (initError) {
        isInitializing = false;
        throw new Error('Wallet kit not initialized. Please refresh the page and try again.');
      }
    }
    
    if (!currentKit) {
      throw new Error('Wallet kit not initialized. Please refresh the page and try again.');
    }

    try {
      await currentKit.openModal({
        onWalletSelected: async (wallet: ISupportedWallet) => {
          await connect(wallet.id);
        },
        onClosed: (err: Error) => {
          if (err) {
            console.warn('Modal closed with error:', err);
          }
        },
        modalTitle: 'Connect Wallet',
        notAvailableText: 'Wallet not available',
      });
    } catch (err) {
      throw err;
    }
  }, [walletKit, connect]);

  // Listen for wallet network changes
  useEffect(() => {
    if (!isFreighterAvailable || !walletData) return;

    // Listen for wallet network change events
    const handleNetworkChange = (event: any) => {
      detectNetworkChange();
    };

    // Listen for Freighter network changes
    window.addEventListener('freighter:networkChanged', handleNetworkChange);

    // Also listen for our custom network change events
    window.addEventListener('networkChanged', handleNetworkChange);

    // Periodic network check (every 10 seconds)
    const networkCheckInterval = setInterval(() => {
      if (walletData?.isConnected) {
        detectNetworkChange();
      }
    }, 10000);

    return () => {
      window.removeEventListener('freighter:networkChanged', handleNetworkChange);
      window.removeEventListener('networkChanged', handleNetworkChange);
      clearInterval(networkCheckInterval);
    };
  }, [isFreighterAvailable, walletData, detectNetworkChange]);

  return {
    walletData,
    isConnected: !!walletData?.isConnected,
    isLoading,
    error,
    connect,
    connectFreighter,
    connectManualAddress,
    disconnect,
    signTransaction,
    sendTransaction,
    getAvailableWallets,
    isFreighterAvailable,
    currentNetwork,
    switchNetwork,
    detectNetworkChange,
    walletKit,
    openWalletModal,
  };
};
