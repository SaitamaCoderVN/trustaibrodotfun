"use client";

import { FC, ReactNode, useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import '@solana/wallet-adapter-react-ui/styles.css';

export type WalletProviderProps = {
  children: ReactNode;
  network?: 'devnet' | 'mainnet-beta' | 'testnet';
};

export const WalletProvider: FC<WalletProviderProps> = ({
  children,
  network = 'devnet',
}) => {
  // Read RPC URL from environment variable, fallback to default cluster API
  const endpoint = useMemo(() => {
    // Check for custom RPC URL from environment
    const customRpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    if (customRpcUrl) {
      return customRpcUrl;
    }
    // Fallback to default cluster API
    return clusterApiUrl(network);
  }, [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};