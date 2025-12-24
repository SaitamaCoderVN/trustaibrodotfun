"use client";

import { FC, useCallback, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet, ChevronDown, Copy, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const WalletButton: FC = () => {
  const { publicKey, wallet, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const address = useMemo(() => {
    if (!publicKey) return null;
    const base58 = publicKey.toBase58();
    return `${base58.slice(0, 4)}...${base58.slice(-4)}`;
  }, [publicKey]);

  const copyAddress = useCallback(() => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
    }
  }, [publicKey]);

  const handleConnect = useCallback(() => {
    setVisible(true);
  }, [setVisible]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  if (!connected || !publicKey) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleConnect}
        className="pixel-btn pixel-btn-green flex items-center gap-2 text-xs"
      >
        <Wallet className="w-4 h-4" />
        CONNECT
      </motion.button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="pixel-box px-4 py-2 font-pixel text-xs flex items-center gap-2"
        >
          {wallet?.adapter.icon && (
            <img
              src={wallet.adapter.icon}
              alt={wallet.adapter.name}
              className="w-4 h-4"
            />
          )}
          <span className="text-[var(--pixel-green)]">{address}</span>
          <ChevronDown className="w-4 h-4" />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 pixel-box border-0 p-2">
        <DropdownMenuItem onClick={copyAddress} className="cursor-pointer hover:bg-gray-100 font-pixel-body">
          <Copy className="w-4 h-4 mr-2 text-[var(--pixel-blue)]" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-black h-[2px]" />
        <DropdownMenuItem
          onClick={handleDisconnect}
          className="cursor-pointer text-[var(--pixel-pink)] hover:bg-[var(--pixel-pink)]/10 font-pixel-body"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};