"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { AIModel } from "@/lib/types";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  Coins,
} from "lucide-react";

type BettingPanelProps = {
  player1: AIModel;
  player2: AIModel;
  player1Odds: number;
  player2Odds: number;
  totalPool: number;
};

export function BettingPanel({
  player1,
  player2,
  player1Odds,
  player2Odds,
  totalPool,
}: BettingPanelProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<"SOL" | "USDC">("SOL");

  const calculatePayout = () => {
    if (!selectedPlayer || betAmount <= 0) return 0;
    const odds = selectedPlayer === player1.id ? player1Odds : player2Odds;
    return (betAmount * odds).toFixed(2);
  };

  const quickAmounts = [0.1, 0.5, 1, 5, 10];

  return (
    <div className="p-6 rounded-3xl clay-block">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl text-[#A66CFF]">
          Place Your Bet
        </h3>
        <div className="clay-badge flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          <span className="font-display">{totalPool.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.button
          whileHover={{ scale: 1.03, y: -4 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setSelectedPlayer(player1.id)}
          className={`
            p-5 rounded-2xl transition-all
            ${selectedPlayer === player1.id ? "clay-block-mint" : "clay-block"}
          `}
        >
          <div className="text-center">
            <div
              className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center ${selectedPlayer === player1.id ? "bg-white/30" : "clay-block-mint"}`}
            >
              <span className="font-display text-xl text-white">
                {player1.shortName.charAt(0)}
              </span>
            </div>
            <p className={`font-display text-lg mb-2 ${selectedPlayer === player1.id ? "text-white" : "text-[#4ECDC4]"}`}>
              {player1.shortName}
            </p>
            <div className="flex items-center justify-center gap-1">
              {player1Odds > 2 ? (
                <TrendingUp className={`w-4 h-4 ${selectedPlayer === player1.id ? "text-white" : "text-[#4ECDC4]"}`} />
              ) : (
                <TrendingDown className={`w-4 h-4 ${selectedPlayer === player1.id ? "text-white" : "text-[#FF6B6B]"}`} />
              )}
              <span className={`text-xl font-display ${selectedPlayer === player1.id ? "text-white" : "text-[#A66CFF]"}`}>
                {player1Odds.toFixed(2)}x
              </span>
            </div>
            <p className={`text-xs mt-1 ${selectedPlayer === player1.id ? "text-white/80" : "text-muted-foreground"}`}>
              {((1 / player1Odds) * 100).toFixed(0)}% implied
            </p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03, y: -4 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setSelectedPlayer(player2.id)}
          className={`
            p-5 rounded-2xl transition-all
            ${selectedPlayer === player2.id ? "clay-block-coral" : "clay-block"}
          `}
        >
          <div className="text-center">
            <div
              className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center ${selectedPlayer === player2.id ? "bg-white/30" : "clay-block-coral"}`}
            >
              <span className="font-display text-xl text-white">
                {player2.shortName.charAt(0)}
              </span>
            </div>
            <p className={`font-display text-lg mb-2 ${selectedPlayer === player2.id ? "text-white" : "text-[#FF6B6B]"}`}>
              {player2.shortName}
            </p>
            <div className="flex items-center justify-center gap-1">
              {player2Odds > 2 ? (
                <TrendingUp className={`w-4 h-4 ${selectedPlayer === player2.id ? "text-white" : "text-[#4ECDC4]"}`} />
              ) : (
                <TrendingDown className={`w-4 h-4 ${selectedPlayer === player2.id ? "text-white" : "text-[#FF6B6B]"}`} />
              )}
              <span className={`text-xl font-display ${selectedPlayer === player2.id ? "text-white" : "text-[#A66CFF]"}`}>
                {player2Odds.toFixed(2)}x
              </span>
            </div>
            <p className={`text-xs mt-1 ${selectedPlayer === player2.id ? "text-white/80" : "text-muted-foreground"}`}>
              {((1 / player2Odds) * 100).toFixed(0)}% implied
            </p>
          </div>
        </motion.button>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm text-muted-foreground font-semibold">Bet Amount</label>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrency("SOL")}
              className={`px-4 py-2 rounded-xl text-sm font-display transition-all ${
                currency === "SOL"
                  ? "clay-block-mint text-white"
                  : "clay-block"
              }`}
            >
              SOL
            </button>
            <button
              onClick={() => setCurrency("USDC")}
              className={`px-4 py-2 rounded-xl text-sm font-display transition-all ${
                currency === "USDC"
                  ? "clay-block-blue text-white"
                  : "clay-block"
              }`}
            >
              USDC
            </button>
          </div>
        </div>

        <div className="relative">
          <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="number"
            value={betAmount || ""}
            onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="w-full pl-12 pr-4 py-4 rounded-2xl clay-input text-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/50 transition-all font-display text-lg"
          />
        </div>

        <div className="flex gap-2 mt-4">
          {quickAmounts.map((amount) => (
            <motion.button
              key={amount}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setBetAmount(amount)}
              className="flex-1 py-3 rounded-xl clay-block text-sm font-display hover:text-[#FF6B6B] transition-colors"
            >
              {amount}
            </motion.button>
          ))}
        </div>
      </div>

      {selectedPlayer && betAmount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl clay-block-yellow mb-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">
              Potential Payout
            </span>
            <span className="text-2xl font-display">
              {calculatePayout()} {currency}
            </span>
          </div>
        </motion.div>
      )}

      <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        disabled={!selectedPlayer || betAmount <= 0}
        className={`w-full py-5 rounded-2xl font-display text-lg flex items-center justify-center gap-2 transition-all
          ${selectedPlayer && betAmount > 0 ? "clay-btn" : "clay-block opacity-60 cursor-not-allowed"}
        `}
      >
        <Wallet className="w-5 h-5" />
        {selectedPlayer
          ? `Bet on ${selectedPlayer === player1.id ? player1.shortName : player2.shortName}`
          : "Select a Player"}
      </motion.button>

      <p className="text-xs text-center text-muted-foreground mt-4 font-medium">
        Connect wallet to place bets. Markets settle after match completion.
      </p>
    </div>
  );
}
