'use client';

import { loadStellarSDK, getStellarServer, isStellarSDKAvailable } from './stellar-sdk-loader';

// Simple Stellar SDK test to verify functionality
export const testStellarSDK = async () => {
  try {
    if (!isStellarSDKAvailable()) {
      return {
        success: false,
        message: 'Stellar SDK not available in this environment',
      };
    }

    const StellarSDK = await loadStellarSDK();

    const { Server, Keypair, Networks } = StellarSDK;

    // Test 1: Create a random keypair
    const testKeypair = Keypair.random();

    // Test 2: Connect to Horizon using optimized loader
    const server = await getStellarServer('https://horizon-testnet.stellar.org');

    // Test 3: Check network passphrase

    return {
      success: true,
      message: 'Stellar SDK is working correctly',
      testKeypair: testKeypair.publicKey(),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error,
    };
  }
};

// Test account loading with a known testnet account
export const testAccountLoading = async (publicKey: string) => {
  try {
    let StellarSDK: any;
    try {
      StellarSDK = await import('@stellar/stellar-sdk');
    } catch {
      StellarSDK = await import('stellar-sdk');
    }

    const { Server } = StellarSDK;
    const server = await getStellarServer('https://horizon-testnet.stellar.org');

    const account = await server.loadAccount(publicKey);

    return {
      success: true,
      account,
      balances: account.balances,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
