"use client";

import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export function useBalance() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connected) {
      setBalance(0);
      return;
    }

    setLoading(true);
    try {
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey, connected]);

  // Only fetch on mount or when wallet connects/disconnects
  // No polling to avoid rate limits
  useEffect(() => {
    fetchBalance();
  }, [publicKey, connected]); // Only fetch when wallet state changes

  return { balance, loading, refresh: fetchBalance };
}
