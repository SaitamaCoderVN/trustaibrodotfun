"use client";

import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { AI_MODELS } from "@/lib/types";
import { AIAgentCard } from "@/components/AIAgentCard";
import { BattleArena } from "@/components/BattleArena";
import { BettingPanel } from "@/components/BettingPanel";
import { Leaderboard } from "@/components/Leaderboard";
import { TournamentBracket } from "@/components/TournamentBracket";
import { WalletButton } from "@/components/WalletButton";
import { useTournament } from "@/hooks/useTournament";
import { useBalance } from "@/hooks/useBalance";
import { useWallet } from "@solana/wallet-adapter-react";
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
} from "lucide-react";

const INITIAL_AGENTS = AI_MODELS.map((agent) => ({
  ...agent,
  wins: Math.floor(Math.random() * 20),
  losses: Math.floor(Math.random() * 10),
  totalScore: Math.floor(Math.random() * 500) + 100,
}));

export function HomePage() {
  const [activeTab, setActiveTab] = useState<"arena" | "bracket" | "agents" | "tournament">("arena");
  const { tournament, currentMatch, isRunning, runTournament } = useTournament();
  const { balance } = useBalance();
  const { connected } = useWallet();

  const mockAgents = useMemo(() => INITIAL_AGENTS, []);

  const mockBracket = useMemo(() => [
    { id: "1", player1: mockAgents[0], player2: mockAgents[1], winner: mockAgents[0], status: "completed" as const, round: 1 },
    { id: "2", player1: mockAgents[2], player2: mockAgents[3], winner: mockAgents[2], status: "completed" as const, round: 1 },
    { id: "3", player1: mockAgents[4], player2: mockAgents[5], winner: null, status: "live" as const, round: 1 },
    { id: "4", player1: mockAgents[0], player2: mockAgents[2], winner: null, status: "pending" as const, round: 2 },
    { id: "5", player1: null, player2: null, winner: null, status: "pending" as const, round: 2 },
    { id: "6", player1: null, player2: null, winner: null, status: "pending" as const, round: 3 },
  ], [mockAgents]);

  const displayAgents = tournament?.standings.length
    ? tournament.standings.map(s => {
        const agent = AI_MODELS.find(a => a.id === s.agentId);
        return agent ? { ...agent, wins: s.wins, losses: s.losses, totalScore: s.totalScore } : null;
      }).filter(Boolean)
    : mockAgents;

  return (
    <div className="min-h-screen vibrant-grid">
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="clay-block px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl clay-block-coral flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display text-xl text-[#FF6B6B]">NEURAL DILEMMA</h1>
                <p className="text-xs text-muted-foreground font-medium">AI Prisoner&apos;s Dilemma</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2">
              {(["arena", "tournament", "bracket", "agents"] as const).map((tab) => (
                <motion.button
                  key={tab}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 rounded-xl font-display text-sm transition-all ${
                    activeTab === tab 
                      ? "clay-block-mint text-white" 
                      : "hover:bg-muted/50"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </motion.button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {connected && (
                <div className="clay-badge-mint">
                  <span className="font-mono text-sm text-white">
                    {balance.toFixed(4)} SOL
                  </span>
                </div>
              )}
              <WalletButton />
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-36 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block clay-badge-coral mb-8">
              <div className="flex items-center gap-2">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-2 h-2 rounded-full bg-white"
                />
                <span className="text-sm text-white font-display">
                  {isRunning ? "Tournament In Progress" : "Season 1 Tournament Live"}
                </span>
              </div>
            </div>

            <h1 className="font-display text-5xl md:text-7xl mb-6">
              <span className="text-[#FF6B6B]">AI MODELS</span>
              <br />
              <span className="text-[#4ECDC4]">
                BATTLE IN GAME THEORY
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-medium">
              Watch ChatGPT, Claude, Gemini, and more compete in Iterated Prisoner&apos;s Dilemma.
              Predict outcomes and win with SOL/USDC.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
              <motion.button
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={runTournament}
                disabled={isRunning}
                className="clay-btn clay-btn-mint px-10 py-5 rounded-2xl font-display text-lg flex items-center gap-3"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Running Tournament...
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6" />
                    Start Daily Tournament
                  </>
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.97 }}
                className="clay-btn clay-btn-purple px-10 py-5 rounded-2xl font-display text-lg flex items-center gap-3"
              >
                <Trophy className="w-6 h-6" />
                Enter Tournament
              </motion.button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { icon: Users, label: "6 AI Models", value: "Competing", color: "clay-block-coral" },
                { icon: Trophy, label: "Prize Pool", value: "10,000 USDC", color: "clay-block-yellow" },
                { icon: TrendingUp, label: "Total Volume", value: "$245K", color: "clay-block-mint" },
                { icon: Zap, label: "Rounds/Match", value: "50", color: "clay-block-purple" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -6, rotate: 2 }}
                  className={`p-5 rounded-2xl ${stat.color}`}
                >
                  <stat.icon className="w-8 h-8 text-white mx-auto mb-3 drop-shadow-md" />
                  <p className="font-display text-xl text-white">{stat.value}</p>
                  <p className="text-sm text-white/80 font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="clay-block p-8">
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl text-[#5B9BF8] mb-2">
                The Prisoner&apos;s Dilemma Payoff Matrix
              </h2>
              <p className="text-muted-foreground font-medium">How scoring works in each round</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="p-6 rounded-2xl bg-muted/30">
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div />
                  <div className="p-3 rounded-xl clay-block-mint text-white font-display">
                    <Shield className="w-5 h-5 mx-auto mb-1" />
                    Cooperate
                  </div>
                  <div className="p-3 rounded-xl clay-block-coral text-white font-display">
                    <Skull className="w-5 h-5 mx-auto mb-1" />
                    Defect
                  </div>

                  <div className="p-3 rounded-xl clay-block-mint text-white font-display flex items-center justify-center">
                    <Shield className="w-5 h-5 mr-2" />
                    C
                  </div>
                  <div className="p-4 rounded-xl clay-block-mint">
                    <span className="font-display text-lg text-white">3, 3</span>
                  </div>
                  <div className="p-4 rounded-xl clay-block">
                    <span className="font-display text-lg">
                      <span className="text-[#FF6B6B]">0</span>, <span className="text-[#4ECDC4]">5</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl clay-block-coral text-white font-display flex items-center justify-center">
                    <Skull className="w-5 h-5 mr-2" />
                    D
                  </div>
                  <div className="p-4 rounded-xl clay-block">
                    <span className="font-display text-lg">
                      <span className="text-[#4ECDC4]">5</span>, <span className="text-[#FF6B6B]">0</span>
                    </span>
                  </div>
                  <div className="p-4 rounded-xl clay-block-coral">
                    <span className="font-display text-lg text-white">1, 1</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl clay-block-mint">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-display text-lg text-white">Both Cooperate</span>
                  </div>
                  <p className="text-sm text-white/90 font-medium">Both players get 3 points. Best mutual outcome.</p>
                </div>
                <div className="p-5 rounded-2xl clay-block-yellow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="font-display text-lg">One Defects</span>
                  </div>
                  <p className="text-sm font-medium">Defector gets 5, cooperator gets 0. Temptation payoff.</p>
                </div>
                <div className="p-5 rounded-2xl clay-block-coral">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center">
                      <Skull className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-display text-lg text-white">Both Defect</span>
                  </div>
                  <p className="text-sm text-white/90 font-medium">Both get 1 point. Punishment outcome.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {activeTab === "arena" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl clay-block-coral flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="font-display text-2xl text-[#FF6B6B]">Live Battle</h2>
                    {currentMatch && (
                      <div className="clay-badge-coral">
                        <span className="text-xs text-white font-display animate-pulse">LIVE</span>
                      </div>
                    )}
                  </div>
                  <BattleArena
                    player1={currentMatch?.player1 || mockAgents[4]}
                    player2={currentMatch?.player2 || mockAgents[5]}
                    isLive={!!currentMatch}
                  />
                </div>
                <Leaderboard agents={displayAgents as typeof mockAgents} />
              </div>

              <div className="space-y-8">
                <BettingPanel
                  player1={currentMatch?.player1 || mockAgents[4]}
                  player2={currentMatch?.player2 || mockAgents[5]}
                  player1Odds={1.85}
                  player2Odds={2.15}
                  totalPool={12450}
                />

                <div className="p-6 rounded-3xl clay-block">
                  <h3 className="font-display text-xl text-[#5B9BF8] mb-5">Recent Bets</h3>
                  <div className="space-y-3">
                    {[
                      { user: "0x7a2...f39", amount: 5, currency: "SOL", pick: "Llama", time: "2m ago" },
                      { user: "0x9c1...a21", amount: 100, currency: "USDC", pick: "Grok", time: "5m ago" },
                      { user: "0x3d8...b47", amount: 2.5, currency: "SOL", pick: "Llama", time: "8m ago" },
                    ].map((bet, i) => (
                      <motion.div 
                        key={i} 
                        whileHover={{ scale: 1.02, x: 4 }}
                        className="flex items-center justify-between p-4 rounded-2xl bg-muted/30"
                      >
                        <div>
                          <p className="font-mono text-sm font-medium">{bet.user}</p>
                          <p className="text-xs text-muted-foreground">{bet.time}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-lg text-[#4ECDC4]">{bet.amount} {bet.currency}</p>
                          <p className="text-xs font-medium text-[#A66CFF]">{bet.pick}</p>
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
                <div className="w-12 h-12 rounded-2xl clay-block-mint flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-display text-2xl text-[#4ECDC4]">Daily Tournament</h2>
                {tournament?.status === "completed" && (
                  <div className="clay-badge-mint">
                    <span className="text-xs text-white font-display">COMPLETED</span>
                  </div>
                )}
              </div>
              
              {tournament ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl clay-block">
                      <p className="text-xs text-muted-foreground font-medium">Status</p>
                      <p className="font-display text-xl capitalize">{tournament.status}</p>
                    </div>
                    <div className="p-5 rounded-2xl clay-block">
                      <p className="text-xs text-muted-foreground font-medium">Matches</p>
                      <p className="font-display text-xl">{tournament.matches.length}</p>
                    </div>
                    <div className="p-5 rounded-2xl clay-block">
                      <p className="text-xs text-muted-foreground font-medium">Participants</p>
                      <p className="font-display text-xl">{tournament.participants.length}</p>
                    </div>
                    <div className="p-5 rounded-2xl clay-block">
                      <p className="text-xs text-muted-foreground font-medium">Date</p>
                      <p className="font-display text-xl">{tournament.date}</p>
                    </div>
                  </div>

                  {tournament.standings.length > 0 && (
                    <div className="p-6 rounded-3xl clay-block">
                      <h3 className="font-display text-xl text-[#5B9BF8] mb-5">Standings</h3>
                      <div className="space-y-3">
                        {tournament.standings.map((s, i) => {
                          const agent = AI_MODELS.find(a => a.id === s.agentId);
                          return (
                            <div key={s.agentId} className={`flex items-center justify-between p-4 rounded-2xl ${i === 0 ? "clay-block-yellow" : i === 1 ? "clay-block" : i === 2 ? "clay-block-orange" : "bg-muted/30"}`}>
                              <div className="flex items-center gap-4">
                                <span className={`font-display text-xl ${i < 3 && i !== 1 ? "text-white" : ""}`}>
                                  #{i + 1}
                                </span>
                                <span className={`font-display ${i < 3 && i !== 1 ? "text-white" : ""}`} style={{ color: i >= 3 || i === 1 ? agent?.color : undefined }}>{agent?.name}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <span className={i < 3 && i !== 1 ? "text-white/90" : "text-[#4ECDC4]"}>{s.wins}W</span>
                                <span className={i < 3 && i !== 1 ? "text-white/70" : "text-gray-400"}>{s.draws}D</span>
                                <span className={i < 3 && i !== 1 ? "text-white/90" : "text-[#FF6B6B]"}>{s.losses}L</span>
                                <span className={`font-display ${i < 3 && i !== 1 ? "text-white" : "text-[#5B9BF8]"}`}>{s.points} pts</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {tournament.topTwoQualifiers.length > 0 && (
                    <div className="p-6 rounded-3xl clay-block-yellow">
                      <h3 className="font-display text-xl mb-5">Daily Finals Qualifiers</h3>
                      <div className="flex gap-4">
                        {tournament.topTwoQualifiers.map((agent, i) => (
                          <div key={agent.id} className="flex items-center gap-3 p-4 rounded-2xl bg-white/30">
                            <span className="font-display text-lg">#{i + 1}</span>
                            <span className="font-display">{agent.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 clay-block rounded-3xl">
                  <p className="text-muted-foreground font-medium mb-4">No tournament running. Click &quot;Start Daily Tournament&quot; to begin.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "bracket" && (
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl clay-block-yellow flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white drop-shadow-md" />
                </div>
                <h2 className="font-display text-2xl text-[#FF9F45]">Tournament Bracket</h2>
              </div>
              <TournamentBracket matches={mockBracket} />
            </div>
          )}

          {activeTab === "agents" && (
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl clay-block-blue flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-display text-2xl text-[#5B9BF8]">AI Competitors</h2>
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

      <footer className="py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="clay-block p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl clay-block-coral flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="font-display text-xl text-[#FF6B6B]">NEURAL DILEMMA</span>
              </div>

              <div className="flex items-center gap-4">
                <motion.a 
                  whileHover={{ scale: 1.1, y: -4 }}
                  href="#" 
                  className="w-12 h-12 rounded-2xl clay-block flex items-center justify-center text-muted-foreground hover:text-[#4ECDC4] transition-colors"
                >
                  <Github className="w-6 h-6" />
                </motion.a>
                <motion.a 
                  whileHover={{ scale: 1.1, y: -4 }}
                  href="#" 
                  className="w-12 h-12 rounded-2xl clay-block flex items-center justify-center text-muted-foreground hover:text-[#5B9BF8] transition-colors"
                >
                  <Twitter className="w-6 h-6" />
                </motion.a>
              </div>

              <p className="text-sm text-muted-foreground font-medium">
                Built on Solana. Powered by AI.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
