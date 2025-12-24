"use client";

import { motion } from "framer-motion";
import { AIModel } from "@/lib/types";
import { ChevronRight, Zap, Trophy } from "lucide-react";
import { AIAvatar } from "./AIAvatar";

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
    if (round === totalRounds) return "FINALS";
    if (round === totalRounds - 1) return "SEMI-FINALS";
    if (round === totalRounds - 2) return "QUARTER-FINALS";
    return `ROUND ${round}`;
  };

  return (
    <div className="p-8 pixel-box overflow-x-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 pixel-box-purple flex items-center justify-center">
          <Trophy className="w-6 h-6" />
        </div>
        <h3 className="font-pixel text-sm text-[var(--pixel-purple)]">
          TOURNAMENT BRACKET
        </h3>
      </div>

      <div className="flex gap-10 min-w-max">
        {rounds.map((round) => (
          <div key={round} className="flex flex-col gap-6">
            <div className="pixel-badge text-center">
              <span className="font-pixel text-xs">
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
                      w-56 p-4 cursor-pointer transition-all
                      ${match.status === "live" ? "pixel-box-pink animate-pulse" : "pixel-box"}
                    `}
                  >
                    {match.status === "live" && (
                      <div className="flex items-center gap-2 text-white text-xs mb-3 justify-center">
                        <div className="w-8 h-8 bg-white/30 border-2 border-black flex items-center justify-center">
                          <Zap className="w-4 h-4" />
                        </div>
                        <span className="font-pixel text-xs">LIVE</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div
                        className={`
                          flex items-center gap-3 p-3 transition-all border-2 border-black
                          ${match.winner?.id === match.player1?.id 
                            ? "bg-[var(--pixel-green)]" 
                            : match.status === "live" ? "bg-white/20" : "bg-gray-100"}
                        `}
                      >
                        {match.player1 ? (
                          <>
                            <AIAvatar 
                              agent={match.player1} 
                              size="md" 
                              className={match.winner?.id === match.player1?.id ? "bg-white/30" : ""}
                            />
                            <span
                              className={`text-xs font-pixel truncate flex-1 ${match.winner?.id === match.player1?.id ? "text-white" : ""}`}
                              style={{ color: match.winner?.id !== match.player1?.id ? match.player1.color : undefined }}
                            >
                              {match.player1.shortName}
                            </span>
                            {match.winner?.id === match.player1.id && (
                              <div className="w-6 h-6 bg-white/30 border-2 border-black flex items-center justify-center">
                                <ChevronRight className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground font-pixel p-2">
                            TBD
                          </span>
                        )}
                      </div>

                      <div
                        className={`
                          flex items-center gap-3 p-3 transition-all border-2 border-black
                          ${match.winner?.id === match.player2?.id 
                            ? "bg-[var(--pixel-green)]" 
                            : match.status === "live" ? "bg-white/20" : "bg-gray-100"}
                        `}
                      >
                        {match.player2 ? (
                          <>
                            <AIAvatar 
                              agent={match.player2} 
                              size="md" 
                              className={match.winner?.id === match.player2?.id ? "bg-white/30" : ""}
                            />
                            <span
                              className={`text-xs font-pixel truncate flex-1 ${match.winner?.id === match.player2?.id ? "text-white" : ""}`}
                              style={{ color: match.winner?.id !== match.player2?.id ? match.player2.color : undefined }}
                            >
                              {match.player2.shortName}
                            </span>
                            {match.winner?.id === match.player2.id && (
                              <div className="w-6 h-6 bg-white/30 border-2 border-black flex items-center justify-center">
                                <ChevronRight className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground font-pixel p-2">
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
