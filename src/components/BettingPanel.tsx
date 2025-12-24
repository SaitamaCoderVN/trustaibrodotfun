"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { AIModel } from "@/lib/types";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  Coins,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useBettingClient, BetData, MarketData } from "@/lib/solana/betting-client";
import { toast } from "sonner";
import { AIAvatar } from "./AIAvatar";

type BettingPanelProps = {
  player1: AIModel;
  player2: AIModel;
  player1Odds: number;
  player2Odds: number;
  totalPool: number;
  matchId: string; // Add matchId prop
  onBetPlaced?: () => void; // Callback when bet is placed
  battleEnded?: boolean; // Trigger refresh when battle ends
};

export function BettingPanel({
  player1,
  player2,
  player1Odds,
  player2Odds,
  totalPool,
  matchId,
  onBetPlaced,
  battleEnded,
}: BettingPanelProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(0);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [userBet, setUserBet] = useState<BetData | null>(null);
  const [market, setMarket] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Start with false - only show loading when user clicks refresh

  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const bettingClient = useBettingClient();

  // Load user's bet and market data
  const loadData = useCallback(async (showLoading = true) => {
    if (!connected || !publicKey || !bettingClient) {
      setIsLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setIsLoading(true);
      }
      // Fetch sequentially to avoid overwhelming RPC
      const marketData = await bettingClient.getMarket(matchId);
      setMarket(marketData);
      
      // Only fetch bet if market exists
      if (marketData) {
        const betData = await bettingClient.getBet(matchId, publicKey);
        setUserBet(betData);
      } else {
        setUserBet(null);
      }
    } catch (error) {
      console.error("Error loading bet data:", error);
      if (showLoading) {
        toast.error("Failed to load data. Please try again.");
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [connected, publicKey, matchId, bettingClient]);

  // Wrapper for onClick handlers
  const handleRefresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  // Auto-polling: Poll when user has a bet and hasn't claimed yet
  // This allows UI to automatically update when market is settled
  useEffect(() => {
    // Only poll if:
    // 1. User has a bet
    // 2. User hasn't claimed yet
    if (!connected || !publicKey || !bettingClient) {
      return;
    }

    const shouldPoll = userBet && !userBet.claimed;
    
    if (!shouldPoll) {
      return;
    }

    // Poll every 10 seconds to check if market is settled (faster for better UX)
    const interval = setInterval(() => {
      loadData(false); // Silent fetch (no loading indicator)
    }, 10000);

    return () => clearInterval(interval);
  }, [connected, publicKey, bettingClient, userBet?.claimed, loadData]);

  // Immediately fetch when battle ends (triggered by parent component)
  // This ensures UI updates right away when market is settled
  useEffect(() => {
    if (battleEnded && connected && publicKey && bettingClient) {
      // Wait a bit for settlement transaction to confirm
      const timeout = setTimeout(() => {
        loadData(false); // Silent fetch
      }, 3000); // 3 seconds should be enough for settlement to confirm

      return () => clearTimeout(timeout);
    }
  }, [battleEnded, connected, publicKey, bettingClient, loadData]);

  const calculatePayout = () => {
    if (!selectedPlayer || betAmount <= 0) return 0;
    const odds = selectedPlayer === player1.id ? player1Odds : player2Odds;
    return (betAmount * odds).toFixed(2);
  };

  const handlePlaceBet = async () => {
    if (!connected || !publicKey || !bettingClient || !selectedPlayer || betAmount <= 0) {
      toast.error("Please connect your wallet and select a player");
      return;
    }

    setIsPlacingBet(true);
    try {
      // Determine AI index: 0 for player1, 1 for player2
      const aiIndex = selectedPlayer === player1.id ? 0 : 1;

      // Validate bet amount
      if (betAmount <= 0) {
        toast.error("Please enter a valid bet amount");
        setIsPlacingBet(false);
        return;
      }

      let tx: string;
      
      // If market doesn't exist, initialize and place bet in one transaction
      if (!market) {
        toast.info("Initializing market and placing bet...");
        try {
          tx = await bettingClient.initializeMarketAndPlaceBet(matchId, aiIndex, betAmount);
        } catch (error: any) {
          // If market already exists (race condition), just place bet
          if (error.message?.includes('already in use') || error.message?.includes('Account already in use')) {
            tx = await bettingClient.placeBet(matchId, aiIndex, betAmount);
          } else {
            throw error;
          }
        }
      } else {
        // Market exists, just place bet
        tx = await bettingClient.placeBet(matchId, aiIndex, betAmount);
      }
      
      toast.success(`Bet placed! ${betAmount} SOL bet on ${selectedPlayer === player1.id ? player1.shortName : player2.shortName}. Transaction: ${tx.slice(0, 8)}...`);
      
      // Wait a bit for transaction to confirm
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Reload data after bet is placed
      await loadData();
      
      // Verify bet was placed correctly
      if (userBet) {
        const betAmountInSol = userBet.amount.toNumber() / 1e9;
        if (Math.abs(betAmountInSol - betAmount) > 0.0001) {
          toast.warning(`Warning: Bet amount mismatch. Expected ${betAmount} SOL, got ${betAmountInSol} SOL`);
        }
      }
      
      setSelectedPlayer(null);
      setBetAmount(0);
      onBetPlaced?.();
    } catch (error: any) {
      console.error("Error placing bet:", error);
      const errorMessage = error.message || "Failed to place bet";
      
      // Provide more specific error messages
      if (errorMessage.includes('insufficient funds')) {
        toast.error("Insufficient funds. Please ensure you have enough SOL for the bet + transaction fees (~0.002 SOL)");
      } else if (errorMessage.includes('Account does not exist')) {
        toast.error("Market not found. Please try again.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsPlacingBet(false);
    }
  };

  const handleClaimWinnings = async () => {
    if (!connected || !publicKey || !bettingClient) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsClaiming(true);
    try {
      const tx = await bettingClient.claimWinnings(matchId);
      toast.success(`Winnings claimed! Transaction: ${tx.slice(0, 8)}...`);
      
      // Wait a bit for transaction to confirm
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reload data after claim
      await loadData();
    } catch (error: any) {
      console.error("Error claiming winnings:", error);
      toast.error(error.message || "Failed to claim winnings");
    } finally {
      setIsClaiming(false);
    }
  };

  const quickAmounts = [0.1, 0.5, 1, 5, 10];

  // Check if user has a bet
  const hasBet = userBet !== null;
  const isDraw = market?.isSettled && market.winningAi === 255;
  const hasWon = market?.isSettled && userBet && !isDraw && userBet.aiIndex === market.winningAi;
  const hasLost = market?.isSettled && userBet && !isDraw && userBet.aiIndex !== market.winningAi;
  const canClaim = (hasWon || (isDraw && hasBet)) && userBet && !userBet.claimed;

  // If user has lost (not draw), show message
  if (hasLost) {
    return (
      <div className="p-6 pixel-box">
        <div className="text-center py-8">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-[var(--pixel-pink)]" />
          <h3 className="font-pixel text-lg text-[var(--pixel-pink)] mb-2">BET LOST</h3>
          <p className="text-muted-foreground font-pixel-body">
            Better luck next time!
          </p>
          <p className="text-sm text-muted-foreground mt-2 font-pixel-body">
            You bet on {userBet.aiIndex === 0 ? player1.shortName : player2.shortName}, 
            but {market.winningAi === 0 ? player1.shortName : player2.shortName} won.
          </p>
        </div>
      </div>
    );
  }

  // If draw, show draw message with claim option
  // Check this BEFORE checking hasWon/hasLost to ensure draw takes priority
  if (isDraw && hasBet && userBet && !userBet.claimed) {
    return (
      <div className="p-6 pixel-box">
        <div className="flex justify-end mb-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 pixel-box hover:bg-opacity-80 transition-opacity disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 text-[var(--pixel-purple)] ${isLoading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 pixel-box flex items-center justify-center">
            <span className="text-2xl">🤝</span>
          </div>
          <h3 className="font-pixel text-lg mb-2">MATCH DRAW</h3>
          <p className="text-muted-foreground font-pixel-body mb-4">
            The match ended in a draw. You can claim your bet refund.
          </p>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClaimWinnings}
            disabled={isClaiming}
            className="w-full py-5 font-pixel text-sm flex items-center justify-center gap-2 pixel-btn disabled:opacity-50"
          >
            {isClaiming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                CLAIMING...
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                CLAIM REFUND
              </>
            )}
          </motion.button>
        </div>
      </div>
    );
  }

  // If user can claim (winner), show claim button
  if (canClaim && hasWon) {
    return (
      <div className="p-6 pixel-box">
        <div className="flex justify-end mb-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 pixel-box hover:bg-opacity-80 transition-opacity disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 text-[var(--pixel-purple)] ${isLoading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-[var(--pixel-green)]" />
          <h3 className="font-pixel text-lg text-[var(--pixel-green)] mb-2">YOU WON!</h3>
          <p className="text-muted-foreground font-pixel-body mb-4">
            Congratulations! Your bet was successful. Claim 2x your bet amount.
          </p>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClaimWinnings}
            disabled={isClaiming}
            className="w-full py-5 font-pixel text-sm flex items-center justify-center gap-2 pixel-btn-green disabled:opacity-50"
          >
            {isClaiming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                CLAIMING...
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                CLAIM WINNINGS
              </>
            )}
          </motion.button>
        </div>
      </div>
    );
  }

  // If user has already claimed
  if (hasWon && userBet?.claimed) {
    return (
      <div className="p-6 pixel-box">
        <div className="flex justify-end mb-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 pixel-box hover:bg-opacity-80 transition-opacity disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 text-[var(--pixel-purple)] ${isLoading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-[var(--pixel-green)]" />
          <h3 className="font-pixel text-lg text-[var(--pixel-green)] mb-2">CLAIMED</h3>
          <p className="text-muted-foreground font-pixel-body">
            You have already claimed your winnings.
          </p>
        </div>
      </div>
      );
  }

  // Show loading state while checking market
  if (isLoading && !market) {
    return (
      <div className="p-6 pixel-box">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-[var(--pixel-purple)]" />
          <p className="text-muted-foreground font-pixel-body">Loading market...</p>
        </div>
      </div>
    );
  }

  // Normal betting panel
  return (
    <div className="p-6 pixel-box">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-pixel text-sm text-[var(--pixel-purple)]">
          PLACE YOUR BET
        </h3>
        <div className="flex items-center gap-3">
          <div className="pixel-badge flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="font-pixel text-xs">{totalPool.toLocaleString()}</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 pixel-box hover:bg-opacity-80 transition-opacity disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 text-[var(--pixel-purple)] ${isLoading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      {hasBet && !market?.isSettled && (
        <div className="mb-4 p-4 pixel-box-yellow">
          <p className="text-sm font-pixel-body">
            You have an active bet: {userBet.amount.toNumber() / 1e9} SOL on{" "}
            {userBet.aiIndex === 0 ? player1.shortName : player2.shortName}
          </p>
        </div>
      )}

      {!market && connected && (
        <div className="mb-4 p-4 pixel-box-yellow">
          <p className="text-sm font-pixel-body mb-2">
            Market will be initialized automatically when you place your first bet.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.button
          whileHover={{ scale: 1.03, y: -4 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setSelectedPlayer(player1.id)}
          disabled={hasBet || market?.isSettled}
          className={`
            p-5 transition-all
            ${selectedPlayer === player1.id ? "pixel-box-green" : "pixel-box"}
            ${hasBet || market?.isSettled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="text-center">
            <div className="mx-auto mb-3">
              <AIAvatar 
                agent={player1} 
                size="lg" 
                className={`border-4 border-black ${selectedPlayer === player1.id ? "bg-white/30" : ""}`} 
              />
            </div>
            <p className={`font-pixel text-xs mb-2 ${selectedPlayer === player1.id ? "text-white" : "text-[var(--pixel-green)]"}`}>
              {player1.shortName}
            </p>
            <div className="flex items-center justify-center gap-1">
              {player1Odds > 2 ? (
                <TrendingUp className={`w-4 h-4 ${selectedPlayer === player1.id ? "text-white" : "text-[var(--pixel-green)]"}`} />
              ) : (
                <TrendingDown className={`w-4 h-4 ${selectedPlayer === player1.id ? "text-white" : "text-[var(--pixel-pink)]"}`} />
              )}
              <span className={`text-xl font-pixel ${selectedPlayer === player1.id ? "text-white" : "text-[var(--pixel-purple)]"}`}>
                {player1Odds.toFixed(2)}x
              </span>
            </div>
            <p className={`text-xs mt-1 font-pixel-body ${selectedPlayer === player1.id ? "text-white/80" : "text-muted-foreground"}`}>
              {((1 / player1Odds) * 100).toFixed(0)}% implied
            </p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03, y: -4 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setSelectedPlayer(player2.id)}
          disabled={hasBet || market?.isSettled}
          className={`
            p-5 transition-all
            ${selectedPlayer === player2.id ? "pixel-box-pink" : "pixel-box"}
            ${hasBet || market?.isSettled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="text-center">
            <div className="mx-auto mb-3">
              <AIAvatar 
                agent={player2} 
                size="lg" 
                className={`border-4 border-black ${selectedPlayer === player2.id ? "bg-white/30" : ""}`} 
              />
            </div>
            <p className={`font-pixel text-xs mb-2 ${selectedPlayer === player2.id ? "text-white" : "text-[var(--pixel-pink)]"}`}>
              {player2.shortName}
            </p>
            <div className="flex items-center justify-center gap-1">
              {player2Odds > 2 ? (
                <TrendingUp className={`w-4 h-4 ${selectedPlayer === player2.id ? "text-white" : "text-[var(--pixel-green)]"}`} />
              ) : (
                <TrendingDown className={`w-4 h-4 ${selectedPlayer === player2.id ? "text-white" : "text-[var(--pixel-pink)]"}`} />
              )}
              <span className={`text-xl font-pixel ${selectedPlayer === player2.id ? "text-white" : "text-[var(--pixel-purple)]"}`}>
                {player2Odds.toFixed(2)}x
              </span>
            </div>
            <p className={`text-xs mt-1 font-pixel-body ${selectedPlayer === player2.id ? "text-white/80" : "text-muted-foreground"}`}>
              {((1 / player2Odds) * 100).toFixed(0)}% implied
            </p>
          </div>
        </motion.button>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm text-muted-foreground font-pixel">BET (SOL)</label>
        </div>

        <div className="relative">
          <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={betAmount > 0 ? betAmount : ""}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                setBetAmount(0);
              } else {
                const num = parseFloat(value);
                if (!isNaN(num) && num > 0) {
                  setBetAmount(num);
                }
              }
            }}
            placeholder="0.00"
            disabled={hasBet || market?.isSettled}
            className="w-full pl-12 pr-4 py-4 pixel-input text-foreground focus:outline-none transition-all font-pixel-body text-lg disabled:opacity-50"
          />
        </div>

        <div className="flex gap-2 mt-4">
          {quickAmounts.map((amount) => (
            <motion.button
              key={amount}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setBetAmount(amount)}
              disabled={hasBet || market?.isSettled}
              className="flex-1 py-3 pixel-box text-sm font-pixel hover:text-[var(--pixel-pink)] transition-colors disabled:opacity-50"
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
          className="p-4 pixel-box-yellow mb-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-pixel">
              PAYOUT
            </span>
            <span className="text-2xl font-pixel">
              {calculatePayout()} SOL
            </span>
          </div>
        </motion.div>
      )}

      {!connected ? (
        <div className="p-4 pixel-box mb-4">
          <p className="text-sm text-center text-muted-foreground font-pixel-body">
            Please connect your wallet to place bets
          </p>
        </div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          disabled={!selectedPlayer || betAmount <= 0 || isPlacingBet || hasBet || market?.isSettled}
          onClick={handlePlaceBet}
          className={`w-full py-5 font-pixel text-sm flex items-center justify-center gap-2 transition-all
            ${selectedPlayer && betAmount > 0 && !hasBet && !market?.isSettled ? "pixel-btn" : "pixel-box opacity-60 cursor-not-allowed"}
          `}
        >
          {isPlacingBet ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              PLACING BET...
            </>
          ) : (
            <>
              <Wallet className="w-5 h-5" />
              {selectedPlayer
                ? `BET ON ${selectedPlayer === player1.id ? player1.shortName : player2.shortName}`
                : "SELECT PLAYER"}
            </>
          )}
        </motion.button>
      )}

      <p className="text-xs text-center text-muted-foreground mt-4 font-pixel-body">
        Connect wallet to place bets. Markets settle after match completion.
      </p>
    </div>
  );
}
