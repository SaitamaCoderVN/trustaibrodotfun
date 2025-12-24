"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, Loader2 } from "lucide-react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useBettingClient } from "@/lib/solana/betting-client";
import { toast } from "sonner";

type PoolDepositProps = {
  matchId: string;
};

export function PoolDeposit({ matchId }: PoolDepositProps) {
  const [amount, setAmount] = useState<number>(0);
  const [isDepositing, setIsDepositing] = useState(false);
  const { publicKey, connected } = useWallet();
  const bettingClient = useBettingClient();

  const handleDeposit = async () => {
    if (!connected || !publicKey || !bettingClient) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsDepositing(true);
    try {
      const tx = await bettingClient.depositToPool(matchId, amount);
      toast.success(`Deposited ${amount} SOL! Transaction: ${tx.slice(0, 8)}...`);
      setAmount(0);
    } catch (error: any) {
      console.error("Error depositing:", error);
      toast.error(error.message || "Failed to deposit");
    } finally {
      setIsDepositing(false);
    }
  };

  const quickAmounts = [0.1, 0.5, 1, 2, 5];

  if (!matchId) {
    return null;
  }

  return (
    <div className="p-6 pixel-box border-4 border-dashed border-gray-400">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 pixel-box-yellow flex items-center justify-center">
          <Coins className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-pixel text-xs text-[var(--pixel-purple)]">TEST DEPOSIT</h3>
          <p className="text-xs text-muted-foreground font-pixel-body">Deposit SOL for testing</p>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-sm text-muted-foreground font-pixel mb-2 block">
          AMOUNT (SOL)
        </label>
        <div className="relative">
          <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount > 0 ? amount : ""}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                setAmount(0);
              } else {
                const num = parseFloat(value);
                if (!isNaN(num) && num > 0) {
                  setAmount(num);
                }
              }
            }}
            placeholder="0.00"
            disabled={isDepositing || !connected}
            className="w-full pl-12 pr-4 py-3 pixel-input text-foreground focus:outline-none transition-all font-pixel-body disabled:opacity-50"
          />
        </div>

        <div className="flex gap-2 mt-3">
          {quickAmounts.map((quickAmount) => (
            <motion.button
              key={quickAmount}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAmount(quickAmount)}
              disabled={isDepositing || !connected}
              className="px-3 py-1.5 pixel-box text-sm font-pixel hover:translate-y-[-2px] transition-all disabled:opacity-50"
            >
              {quickAmount}
            </motion.button>
          ))}
        </div>
      </div>

      <motion.button
        whileHover={connected && amount > 0 && !isDepositing ? { scale: 1.02 } : {}}
        whileTap={connected && amount > 0 && !isDepositing ? { scale: 0.98 } : {}}
        onClick={handleDeposit}
        disabled={!connected || amount <= 0 || isDepositing}
        className={`w-full py-3 font-pixel text-xs flex items-center justify-center gap-2 transition-all ${
          connected && amount > 0 && !isDepositing
            ? "pixel-btn"
            : "pixel-box opacity-50 cursor-not-allowed"
        }`}
      >
        {isDepositing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            DEPOSITING...
          </>
        ) : (
          <>
            <Coins className="w-4 h-4" />
            DEPOSIT
          </>
        )}
      </motion.button>

      {!connected && (
        <p className="text-xs text-muted-foreground text-center mt-2 font-pixel-body">
          Connect wallet to deposit
        </p>
      )}
    </div>
  );
}

