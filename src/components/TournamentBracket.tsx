"use client";

import { motion } from "framer-motion";
import { AIModel } from "@/lib/types";
import { ChevronRight, Zap, Trophy } from "lucide-react";

type BracketMatch = {
  id: string;
  player1: AIModel | null;
  player2: AIModel | null;
  winner: AIModel | null;
  status: "pending" | "live" | "completed";
  round: number;
};

type TournamentBracketProps = {
  matches: BracketMatch[];
  onMatchClick?: (matchId: string) => void;
};

export function TournamentBracket({
  matches,
  onMatchClick,
}: TournamentBracketProps) {
  const rounds = Array.from(new Set(matches.map((m) => m.round))).sort();

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds) return "Finals";
    if (round === totalRounds - 1) return "Semi-Finals";
    if (round === totalRounds - 2) return "Quarter-Finals";
    return `Round ${round}`;
  };

  return (
    <div className="p-8 rounded-3xl clay-block overflow-x-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl clay-block-purple flex items-center justify-center">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-display text-2xl text-[#A66CFF]">
          Tournament Bracket
        </h3>
      </div>

      <div className="flex gap-10 min-w-max">
        {rounds.map((round) => (
          <div key={round} className="flex flex-col gap-6">
            <div className="clay-badge text-center">
              <span className="font-display text-sm">
                {getRoundName(round, rounds.length)}
              </span>
            </div>

            <div
              className="flex flex-col gap-6 justify-around"
              style={{ minHeight: `${Math.pow(2, rounds.length - round) * 100}px` }}
            >
              {matches
                .filter((m) => m.round === round)
                .map((match) => (
                  <motion.div
                    key={match.id}
                    whileHover={{ scale: 1.03, y: -4 }}
                    onClick={() => onMatchClick?.(match.id)}
                    className={`
                      w-56 p-4 rounded-2xl cursor-pointer transition-all
                      ${match.status === "live" ? "clay-block-coral animate-pulse-block" : "clay-block"}
                    `}
                  >
                    {match.status === "live" && (
                      <div className="flex items-center gap-2 text-white text-xs mb-3 justify-center">
                        <div className="w-8 h-8 rounded-xl bg-white/30 flex items-center justify-center">
                          <Zap className="w-4 h-4" />
                        </div>
                        <span className="font-display">LIVE NOW</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div
                        className={`
                          flex items-center gap-3 p-3 rounded-xl transition-all
                          ${match.winner?.id === match.player1?.id 
                            ? "clay-block-mint" 
                            : match.status === "live" ? "bg-white/20" : "bg-muted/30"}
                        `}
                      >
                        {match.player1 ? (
                          <>
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-display ${match.winner?.id === match.player1?.id ? "bg-white/30 text-white" : ""}`}
                              style={{
                                backgroundColor: match.winner?.id !== match.player1?.id ? `${match.player1.color}22` : undefined,
                                color: match.winner?.id !== match.player1?.id ? match.player1.color : undefined,
                              }}
                            >
                              {match.player1.shortName.charAt(0)}
                            </div>
                            <span
                              className={`text-sm font-display truncate flex-1 ${match.winner?.id === match.player1?.id ? "text-white" : ""}`}
                              style={{ color: match.winner?.id !== match.player1?.id ? match.player1.color : undefined }}
                            >
                              {match.player1.shortName}
                            </span>
                            {match.winner?.id === match.player1.id && (
                              <div className="w-6 h-6 rounded-lg bg-white/30 flex items-center justify-center">
                                <ChevronRight className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground font-display p-2">
                            TBD
                          </span>
                        )}
                      </div>

                      <div
                        className={`
                          flex items-center gap-3 p-3 rounded-xl transition-all
                          ${match.winner?.id === match.player2?.id 
                            ? "clay-block-mint" 
                            : match.status === "live" ? "bg-white/20" : "bg-muted/30"}
                        `}
                      >
                        {match.player2 ? (
                          <>
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-display ${match.winner?.id === match.player2?.id ? "bg-white/30 text-white" : ""}`}
                              style={{
                                backgroundColor: match.winner?.id !== match.player2?.id ? `${match.player2.color}22` : undefined,
                                color: match.winner?.id !== match.player2?.id ? match.player2.color : undefined,
                              }}
                            >
                              {match.player2.shortName.charAt(0)}
                            </div>
                            <span
                              className={`text-sm font-display truncate flex-1 ${match.winner?.id === match.player2?.id ? "text-white" : ""}`}
                              style={{ color: match.winner?.id !== match.player2?.id ? match.player2.color : undefined }}
                            >
                              {match.player2.shortName}
                            </span>
                            {match.winner?.id === match.player2.id && (
                              <div className="w-6 h-6 rounded-lg bg-white/30 flex items-center justify-center">
                                <ChevronRight className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground font-display p-2">
                            TBD
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
