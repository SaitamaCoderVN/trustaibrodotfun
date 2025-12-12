"use client";

import { FC, ReactNode } from 'react';
import { WalletProvider } from '@/lib/solana/wallet-provider';

export const Providers: FC<{ children: ReactNode }> = ({ children }) => {
  return <WalletProvider network="devnet">{children}</WalletProvider>;
};
