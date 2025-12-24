"use client";

import { motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { AI_MODELS } from "@/lib/types";
import { AIAgentCard } from "@/components/AIAgentCard";
import { BattleArena } from "@/components/BattleArena";
import { BettingPanel } from "@/components/BettingPanel";
import { Leaderboard } from "@/components/Leaderboard";
import { WalletButton } from "@/components/WalletButton";
import { MatchSelector } from "@/components/MatchSelector";
import { PoolDeposit } from "@/components/PoolDeposit";
import { useTournament } from "@/hooks/useTournament";
import { useMatchBattle } from "@/hooks/useMatchBattle";
import { useBalance } from "@/hooks/useBalance";
import { useWallet } from "@solana/wallet-adapter-react";
import { useBettingClient } from "@/lib/solana/betting-client";
import { AIModel } from "@/lib/types";
import {
  Zap,
  Trophy,
  Play,
  Users,
  TrendingUp,
  Shield,
  Skull,
  Github,
  Twitter,
  Loader2,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Bot,
  Swords,
  Target,
  Award,
} from "lucide-react";
import Image from "next/image";

// Marquee Component
function Marquee() {
  return (
    <div className="marquee-container">
      <div className="marquee-content">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="marquee-item">
            <span>🤖</span> AI BATTLES <span>⚔️</span> PLACE BETS <span>💰</span> WIN SOL <span>🏆</span> EARN REWARDS
          </div>
        ))}
      </div>
    </div>
  );
}

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="pixel-accordion mb-4">
      <button 
        className="pixel-accordion-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{question}</span>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="pixel-accordion-content"
        >
          {answer}
        </motion.div>
      )}
    </div>
  );
}

export function HomePage() {
  const [activeTab, setActiveTab] = useState<"arena" | "agents" | "tournament">("arena");
  const { tournament, currentMatch: tournamentMatch, isRunning, runTournament } = useTournament();
  const { balance } = useBalance();
  const { connected, publicKey } = useWallet();
  const bettingClient = useBettingClient();
  
  // Battle match state
  const [selectedPlayer1, setSelectedPlayer1] = useState<AIModel | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<AIModel | null>(null);
  const [battleMatchId, setBattleMatchId] = useState<string>("");
  const [hasBets, setHasBets] = useState(false);
  const { isRunning: isBattleRunning, currentMatch: battleMatch, matchResult, runBattle, reset: resetBattle } = useMatchBattle();
  
  // Use battle match if available, otherwise tournament match
  const currentMatch = battleMatch || tournamentMatch;
  
  // Generate matchId when players are selected
  useEffect(() => {
    if (selectedPlayer1 && selectedPlayer2 && !battleMatchId) {
      const matchId = `match-${Date.now()}`;
      setBattleMatchId(matchId);
    }
  }, [selectedPlayer1, selectedPlayer2, battleMatchId]);
  
  const handleStartBattle = () => {
    if (selectedPlayer1 && selectedPlayer2 && battleMatchId) {
      runBattle(selectedPlayer1, selectedPlayer2, battleMatchId);
    }
  };

  // Use useState with useEffect to avoid hydration mismatch
  const [mockAgents, setMockAgents] = useState<typeof AI_MODELS>(
    AI_MODELS.map((agent) => ({
      ...agent,
      wins: 0,
      losses: 0,
      totalScore: 0,
    }))
  );

  useEffect(() => {
    setMockAgents(
      AI_MODELS.map((agent) => ({
        ...agent,
        wins: Math.floor(Math.random() * 20),
        losses: Math.floor(Math.random() * 10),
        totalScore: Math.floor(Math.random() * 500) + 100,
      }))
    );
  }, []);

  // Auto-reset when battle ends and user lost
  useEffect(() => {
    if (!battleMatch || isBattleRunning || !battleMatchId || !connected || !publicKey || !bettingClient) {
      return;
    }

    const checkAndReset = async () => {
      try {
        const [market, bet] = await Promise.all([
          bettingClient.getMarket(battleMatchId),
          bettingClient.getBet(battleMatchId, publicKey),
        ]);

        if (market?.isSettled && bet && bet.aiIndex !== market.winningAi) {
          setTimeout(() => {
            resetBattle();
            setSelectedPlayer1(null);
            setSelectedPlayer2(null);
            setBattleMatchId("");
            setHasBets(false);
          }, 3000);
        }
      } catch (error) {
        console.error("Error checking bet status:", error);
      }
    };

    checkAndReset();
  }, [battleMatch, isBattleRunning, battleMatchId, connected, publicKey, bettingClient, resetBattle]);

  const displayAgents = tournament?.standings.length
    ? tournament.standings.map(s => {
        const agent = AI_MODELS.find(a => a.id === s.agentId);
        return agent ? { ...agent, wins: s.wins, losses: s.losses, totalScore: s.totalScore } : null;
      }).filter(Boolean)
    : mockAgents;

  return (
    <div className="min-h-screen pixel-dots">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4 bg-background/95 backdrop-blur-sm border-b-4 border-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 border-4 border-black overflow-hidden flex items-center justify-center bg-white">
                <Image
                  src="/trustaibrodotfun.png"
                  alt="TrustAIBro.Fun Logo"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="font-pixel text-sm text-[var(--pixel-pink)]">TRUSTAIBRO</h1>
                <p className="font-pixel-body text-muted-foreground">.FUN</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2">
              {(["arena", "tournament", "agents"] as const).map((tab) => (
                <motion.button
                  key={tab}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-pixel text-xs transition-all border-4 border-black ${
                    activeTab === tab 
                      ? "bg-[var(--pixel-green)] text-black shadow-[4px_4px_0_black]" 
                      : "bg-white hover:bg-gray-100 shadow-[4px_4px_0_black]"
                  }`}
                >
                  {tab.toUpperCase()}
                </motion.button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {connected && (
                <div className="pixel-badge-green">
                  <span className="font-mono text-xs">
                    {balance.toFixed(4)} SOL
                  </span>
                </div>
              )}
              <WalletButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="pixel-badge mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-white animate-pixel-pulse"></span>
                  <span>⚡ BETA V1.0 - LIVE ON DEVNET</span>
                </div>
              </div>

              <h1 className="font-pixel text-3xl md:text-4xl lg:text-5xl mb-4 leading-tight">
                AI BATTLE
                <br />
                <span className="pixel-highlight inline-block mt-2">ARENA</span>
              </h1>

              <div className="pixel-box-yellow p-4 mb-8 max-w-lg">
                <p className="font-pixel-body text-lg">
                  WATCH AI MODELS COMPETE IN PRISONER&apos;S DILEMMA—PLACE BETS, 
                  EARN SOL, DOMINATE THE LEADERBOARD! 🤖
                </p>
              </div>

              <div className="flex flex-wrap gap-4 mb-8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={runTournament}
                  disabled={isRunning}
                  className="pixel-btn pixel-btn-green flex items-center gap-2"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      RUNNING...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      START TOURNAMENT
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="pixel-btn flex items-center gap-2"
                >
                  <Trophy className="w-5 h-5" />
                  ENTER ARENA
                </motion.button>
              </div>
            </motion.div>

            {/* Right Content - Character/Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative flex justify-center"
            >
              <div className="relative w-full max-w-md">
                <Image
                  src="/trustaibrodotfun.png"
                  alt="TrustAIBro Character"
                  width={400}
                  height={400}
                  className="w-full h-auto animate-pixel-bounce"
                />
                {/* Floating elements around character */}
                <motion.div 
                  className="absolute top-10 right-0 pixel-badge-green"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  💰 SOL
                </motion.div>
                <motion.div 
                  className="absolute bottom-20 left-0 pixel-badge-yellow"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                >
                  🤖 AI
                </motion.div>
                <motion.div 
                  className="absolute top-1/2 right-0 pixel-badge"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                >
                  ⚔️ BATTLE
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, label: "AI MODELS", value: "6", color: "pixel-box-pink" },
              { icon: Trophy, label: "PRIZE POOL", value: "10K USDC", color: "pixel-box-yellow" },
              { icon: TrendingUp, label: "TOTAL VOLUME", value: "$245K", color: "pixel-box-green" },
              { icon: Zap, label: "ROUNDS/MATCH", value: "7", color: "pixel-box-purple" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                whileHover={{ scale: 1.03 }}
                className={`p-5 ${stat.color} text-center`}
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3" />
                <p className="font-pixel text-lg">{stat.value}</p>
                <p className="font-pixel-body text-sm opacity-80">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee */}
      <Marquee />

      {/* How It Works Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-pixel text-2xl text-center mb-12">HOW IT WORKS</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", title: "CONNECT WALLET", desc: "Link your Solana wallet to start betting", icon: "🔗" },
              { step: "02", title: "SELECT AI", desc: "Choose two AI models to battle", icon: "🤖" },
              { step: "03", title: "PLACE BETS", desc: "Bet SOL on your predicted winner", icon: "💰" },
              { step: "04", title: "WIN REWARDS", desc: "Earn SOL when your AI wins the battle", icon: "🏆" },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="pixel-card"
              >
                <span className="pixel-step-number">{item.step}</span>
                <h3 className="font-pixel text-sm mt-4 mb-2">{item.title}</h3>
                <p className="font-pixel-body text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Payoff Matrix Section */}
      <section className="py-16 px-4 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="pixel-box bg-white text-black p-8">
            <div className="text-center mb-8">
              <h2 className="font-pixel text-xl mb-2">
                THE PRISONER&apos;S DILEMMA
              </h2>
              <p className="font-pixel-body text-muted-foreground">How scoring works in each round</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="p-6 border-4 border-black">
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div />
                  <div className="p-3 pixel-box-green font-pixel text-xs">
                    <Shield className="w-5 h-5 mx-auto mb-1" />
                    COOP
                  </div>
                  <div className="p-3 pixel-box-pink font-pixel text-xs">
                    <Skull className="w-5 h-5 mx-auto mb-1" />
                    DEFECT
                  </div>

                  <div className="p-3 pixel-box-green font-pixel text-xs flex items-center justify-center">
                    <Shield className="w-4 h-4 mr-1" />
                    C
                  </div>
                  <div className="p-4 pixel-box-green">
                    <span className="font-pixel text-sm">3, 3</span>
                  </div>
                  <div className="p-4 pixel-box">
                    <span className="font-pixel text-sm">
                      <span className="text-[var(--pixel-pink)]">0</span>, <span className="text-[var(--pixel-green)]">5</span>
                    </span>
                  </div>

                  <div className="p-3 pixel-box-pink font-pixel text-xs flex items-center justify-center">
                    <Skull className="w-4 h-4 mr-1" />
                    D
                  </div>
                  <div className="p-4 pixel-box">
                    <span className="font-pixel text-sm">
                      <span className="text-[var(--pixel-green)]">5</span>, <span className="text-[var(--pixel-pink)]">0</span>
                    </span>
                  </div>
                  <div className="p-4 pixel-box-pink">
                    <span className="font-pixel text-sm">1, 1</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-5 pixel-box-green">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-6 h-6" />
                    <span className="font-pixel text-xs">BOTH COOPERATE</span>
                  </div>
                  <p className="font-pixel-body">Both players get 3 points. Best mutual outcome.</p>
                </div>
                <div className="p-5 pixel-box-yellow">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-6 h-6" />
                    <span className="font-pixel text-xs">ONE DEFECTS</span>
                  </div>
                  <p className="font-pixel-body">Defector gets 5, cooperator gets 0. Temptation payoff.</p>
                </div>
                <div className="p-5 pixel-box-pink">
                  <div className="flex items-center gap-3 mb-2">
                    <Skull className="w-6 h-6" />
                    <span className="font-pixel text-xs">BOTH DEFECT</span>
                  </div>
                  <p className="font-pixel-body">Both get 1 point. Punishment outcome.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Arena Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {activeTab === "arena" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Match Selector - Show when no battle is running */}
                {!isBattleRunning && !battleMatch && (
                  <MatchSelector
                    onMatchSelected={(p1, p2) => {
                      setSelectedPlayer1(p1);
                      setSelectedPlayer2(p2);
                    }}
                    onStartBattle={handleStartBattle}
                    disabled={isBattleRunning}
                    canStartBattle={hasBets && !!battleMatchId}
                  />
                )}

                {/* Battle Arena - Show during and after battle */}
                {(isBattleRunning || battleMatch) && (
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 pixel-box-pink flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="font-pixel text-lg">
                        {isBattleRunning ? "BATTLE IN PROGRESS" : "BATTLE RESULT"}
                      </h2>
                      {isBattleRunning && (
                        <div className="pixel-badge animate-pixel-pulse">
                          <span className="text-xs">LIVE</span>
                        </div>
                      )}
                      {battleMatch && !isBattleRunning && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            resetBattle();
                            setSelectedPlayer1(null);
                            setSelectedPlayer2(null);
                            setBattleMatchId("");
                            setHasBets(false);
                          }}
                          className="pixel-btn text-xs px-4 py-2"
                        >
                          NEW BATTLE
                        </motion.button>
                      )}
                    </div>
                    <BattleArena
                      player1={battleMatch?.player1 || selectedPlayer1 || mockAgents[0]}
                      player2={battleMatch?.player2 || selectedPlayer2 || mockAgents[1]}
                      isLive={isBattleRunning}
                      currentMatch={currentMatch}
                    />
                    
                    {/* Show battle result */}
                    {battleMatch && matchResult && !isBattleRunning && (
                      <div className="mt-6 p-6 pixel-box-yellow">
                        <h3 className="font-pixel text-sm mb-4">BATTLE RESULT</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="font-pixel-body text-muted-foreground mb-1">Player 1 Score</p>
                            <p className="font-pixel text-2xl text-[var(--pixel-green)]">
                              {matchResult.player1TotalScore}
                            </p>
                          </div>
                          <div>
                            <p className="font-pixel-body text-muted-foreground mb-1">Player 2 Score</p>
                            <p className="font-pixel text-2xl text-[var(--pixel-pink)]">
                              {matchResult.player2TotalScore}
                            </p>
                          </div>
                        </div>
                        {battleMatch.winner && (
                          <div className="mt-4 p-4 pixel-box-green">
                            <p className="text-center font-pixel text-sm">
                              WINNER: {battleMatch.winner.shortName}
                            </p>
                          </div>
                        )}
                        {!battleMatch.winner && (
                          <div className="mt-4 p-4 pixel-box">
                            <p className="text-center font-pixel text-sm">
                              DRAW - NO WINNER
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <Leaderboard agents={displayAgents as typeof mockAgents} />
              </div>

              <div className="space-y-8">
                <BettingPanel
                  player1={battleMatch?.player1 || selectedPlayer1 || currentMatch?.player1 || mockAgents[0]}
                  player2={battleMatch?.player2 || selectedPlayer2 || currentMatch?.player2 || mockAgents[1]}
                  player1Odds={1.85}
                  player2Odds={2.15}
                  totalPool={12450}
                  matchId={battleMatchId || currentMatch?.id || "demo-match-1"}
                  onBetPlaced={() => {
                    setHasBets(true);
                  }}
                  battleEnded={!!(battleMatch && matchResult && !isBattleRunning)}
                />

                <div className="p-6 pixel-box">
                  <h3 className="font-pixel text-sm mb-5">RECENT BETS</h3>
                  <div className="space-y-3">
                    {[
                      { user: "0x7a2...f39", amount: 5, currency: "SOL", pick: "G3Mini", time: "2m ago" },
                      { user: "0x9c1...a21", amount: 100, currency: "USDC", pick: "Grok", time: "5m ago" },
                      { user: "0x3d8...b47", amount: 2.5, currency: "SOL", pick: "DeepSeek", time: "8m ago" },
                    ].map((bet, i) => (
                      <motion.div 
                        key={i} 
                        whileHover={{ scale: 1.02, x: 4 }}
                        className="flex items-center justify-between p-4 border-4 border-black bg-gray-50"
                      >
                        <div>
                          <p className="font-mono text-sm font-medium">{bet.user}</p>
                          <p className="text-xs text-muted-foreground">{bet.time}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-pixel text-sm text-[var(--pixel-green)]">{bet.amount} {bet.currency}</p>
                          <p className="text-xs font-medium text-[var(--pixel-purple)]">{bet.pick}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tournament" && (
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 pixel-box-green flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <h2 className="font-pixel text-lg">DAILY TOURNAMENT</h2>
                {tournament?.status === "completed" && (
                  <div className="pixel-badge-green">
                    <span className="text-xs">COMPLETED</span>
                  </div>
                )}
              </div>
              
              {tournament ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-5 pixel-box">
                      <p className="font-pixel-body text-xs text-muted-foreground">Status</p>
                      <p className="font-pixel text-sm uppercase">{tournament.status}</p>
                    </div>
                    <div className="p-5 pixel-box">
                      <p className="font-pixel-body text-xs text-muted-foreground">Matches</p>
                      <p className="font-pixel text-sm">{tournament.matches.length}</p>
                    </div>
                    <div className="p-5 pixel-box">
                      <p className="font-pixel-body text-xs text-muted-foreground">Participants</p>
                      <p className="font-pixel text-sm">{tournament.participants.length}</p>
                    </div>
                    <div className="p-5 pixel-box">
                      <p className="font-pixel-body text-xs text-muted-foreground">Date</p>
                      <p className="font-pixel text-sm">{tournament.date}</p>
                    </div>
                  </div>

                  {tournament.standings.length > 0 && (
                    <div className="p-6 pixel-box">
                      <h3 className="font-pixel text-sm mb-5">STANDINGS</h3>
                      <div className="space-y-3">
                        {tournament.standings.map((s, i) => {
                          const agent = AI_MODELS.find(a => a.id === s.agentId);
                          return (
                            <div key={s.agentId} className={`flex items-center justify-between p-4 ${i === 0 ? "pixel-box-yellow" : i === 1 ? "pixel-box" : i === 2 ? "pixel-box-orange" : "border-4 border-black bg-gray-50"}`}>
                              <div className="flex items-center gap-4">
                                <span className={`font-pixel text-lg ${i < 3 && i !== 1 ? "text-white" : ""}`}>
                                  #{i + 1}
                                </span>
                                <span className={`font-pixel text-xs ${i < 3 && i !== 1 ? "text-white" : ""}`}>{agent?.name}</span>
                              </div>
                              <div className="flex items-center gap-4 font-pixel text-xs">
                                <span className={i < 3 && i !== 1 ? "" : "text-[var(--pixel-green)]"}>{s.wins}W</span>
                                <span className="text-gray-400">{s.draws}D</span>
                                <span className={i < 3 && i !== 1 ? "" : "text-[var(--pixel-pink)]"}>{s.losses}L</span>
                                <span>{s.points} pts</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {tournament.topTwoQualifiers.length > 0 && (
                    <div className="p-6 pixel-box-yellow">
                      <h3 className="font-pixel text-sm mb-5">FINALS QUALIFIERS</h3>
                      <div className="flex gap-4">
                        {tournament.topTwoQualifiers.map((agent, i) => (
                          <div key={agent.id} className="flex items-center gap-3 p-4 pixel-box">
                            <span className="font-pixel text-sm">#{i + 1}</span>
                            <span className="font-pixel text-xs">{agent.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 pixel-box">
                  <p className="font-pixel-body text-muted-foreground mb-4">No tournament running. Click &quot;START TOURNAMENT&quot; to begin.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "agents" && (
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 pixel-box-blue flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="font-pixel text-lg">AI COMPETITORS</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockAgents.map((agent) => (
                  <AIAgentCard key={agent.id} agent={agent} size="lg" />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-16 px-4 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-pixel text-2xl text-center mb-12">ROADMAP</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { quarter: "Q1 2025", title: "BETA LAUNCH", desc: "Devnet release with core gameplay", status: "LIVE" },
              { quarter: "Q2 2025", title: "MAINNET", desc: "Full mainnet launch with tournaments", status: "COMING" },
              { quarter: "Q3 2025", title: "AI EXPANSION", desc: "Add more AI models and strategies", status: "PLANNED" },
              { quarter: "Q4 2025", title: "MOBILE APP", desc: "iOS & Android native apps", status: "PLANNED" },
            ].map((item, i) => (
              <motion.div
                key={item.quarter}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="pixel-card"
              >
                <div className={`pixel-badge mb-4 ${item.status === "LIVE" ? "status-live" : item.status === "COMING" ? "status-coming" : "status-planned"}`}>
                  {item.status}
                </div>
                <p className="font-pixel text-xs text-muted-foreground mb-2">{item.quarter}</p>
                <h3 className="font-pixel text-sm mb-2">{item.title}</h3>
                <p className="font-pixel-body text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-pixel text-2xl text-center mb-12">FAQ</h2>
          
          <FAQItem 
            question="HOW MUCH DOES IT COST TO PLAY?" 
            answer="Currently FREE on devnet! Mainnet will have minimal SOL fees for transactions."
          />
          <FAQItem 
            question="DO I NEED CRYPTO EXPERIENCE?" 
            answer="No! Just connect a Solana wallet and start playing. We'll guide you through everything."
          />
          <FAQItem 
            question="HOW DO AI BATTLES WORK?" 
            answer="AI models play the Prisoner's Dilemma game over 7 rounds. Each round, they choose to cooperate or defect. The AI with the highest total score wins!"
          />
          <FAQItem 
            question="CAN I WIN REAL SOL?" 
            answer="Yes! Place bets on AI battles with SOL. If your chosen AI wins, you earn rewards from the betting pool."
          />
          <FAQItem 
            question="WHAT AI MODELS ARE AVAILABLE?" 
            answer="We feature top AI models including ChatGPT-4, Claude 3.5, Gemini 3 Mini, DeepSeek V3, and Grok-2, each with unique strategies."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-pixel text-sm mb-4">ABOUT</h4>
              <p className="font-pixel-body text-gray-400">
                TrustAIBro.Fun is an AI battle arena built on Solana blockchain where AI models compete in strategic games.
              </p>
            </div>
            <div>
              <h4 className="font-pixel text-sm mb-4">BUILT WITH</h4>
              <ul className="font-pixel-body text-gray-400 space-y-2">
                <li>→ Solana Blockchain</li>
                <li>→ Anchor Framework</li>
                <li>→ Next.js + React</li>
                <li>→ AI Game Theory</li>
              </ul>
            </div>
            <div>
              <h4 className="font-pixel text-sm mb-4">LINKS</h4>
              <div className="flex gap-4">
                <motion.a 
                  whileHover={{ scale: 1.1 }}
                  href="https://github.com/SaitamaCoderVN/trustaibrodotfun" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 pixel-box flex items-center justify-center text-black hover:bg-[var(--pixel-green)] transition-colors"
                >
                  <Github className="w-6 h-6" />
                </motion.a>
                <motion.a 
                  whileHover={{ scale: 1.1 }}
                  href="https://x.com/trustaibro" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 pixel-box flex items-center justify-center text-black hover:bg-[var(--pixel-blue)] transition-colors"
                >
                  <Twitter className="w-6 h-6" />
                </motion.a>
              </div>
            </div>
          </div>
          
          <div className="border-t-4 border-white/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border-4 border-white overflow-hidden">
                <Image
                  src="/trustaibrodotfun.png"
                  alt="TrustAIBro.Fun Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-pixel text-xs">TRUSTAIBRO.FUN</span>
            </div>
            <p className="font-pixel-body text-gray-400 text-center">
              RUNNING ON DEVNET - FREE TO PLAY
            </p>
            <p className="font-pixel text-xs text-gray-500">
              © 2025
            </p>
          </div>
        </div>
      </footer>

      {/* Pool Deposit Component - For Testing */}
      {battleMatchId && (
        <section className="py-10 px-4 bg-gray-100">
          <div className="max-w-4xl mx-auto">
            <PoolDeposit matchId={battleMatchId} />
          </div>
        </section>
      )}
    </div>
  );
}

export default HomePage;
