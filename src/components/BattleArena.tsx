"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AIModel, Move, RoundResult, PAYOFF_MATRIX } from "@/lib/types";
import { useState, useEffect } from "react";
import { AIAvatar } from "./AIAvatar";
import { Swords, Shield, Skull, Sparkles } from "lucide-react";

type BattleArenaProps = {
  player1: AIModel;
  player2: AIModel;
  isLive?: boolean;
  currentMatch?: { rounds: RoundResult[]; currentRound: number; status: string } | null;
  onRoundComplete?: (result: RoundResult) => void;
};

export function BattleArena({
  player1,
  player2,
  isLive = false,
  currentMatch,
}: BattleArenaProps) {
  // Safety check
  if (!player1 || !player2) {
    return (
      <div className="p-8 rounded-3xl clay-block">
        <p className="text-center text-muted-foreground">Loading players...</p>
      </div>
    );
  }

  // Use currentMatch data if available, otherwise use local state
  const rounds = currentMatch?.rounds || [];
  const currentRound = currentMatch?.currentRound || 0;
  const isCompleted = currentMatch?.status === "completed";
  
  // Calculate total scores from rounds
  const player1Score = rounds.reduce((sum, r) => sum + r.player1Score, 0);
  const player2Score = rounds.reduce((sum, r) => sum + r.player2Score, 0);
  
  // Get current round data
  const currentRoundData = rounds.length > 0 ? rounds[rounds.length - 1] : null;
  const player1Move = currentRoundData?.player1Move || null;
  const player2Move = currentRoundData?.player2Move || null;
  
  // Determine phase based on match state
  // Show "thinking" if we're waiting for the next round
  const isWaitingForNextRound = isLive && !isCompleted && rounds.length < currentRound;
  const phase = isLive && !isCompleted 
    ? (isWaitingForNextRound ? "thinking" : currentRoundData ? "reveal" : "thinking")
    : isCompleted 
      ? "result" 
      : "thinking";

  const MoveIcon = ({ move }: { move: Move | null }) => {
    if (!move)
      return (
        <div className="w-20 h-20 rounded-2xl clay-block animate-pulse flex items-center justify-center">
          <span className="text-3xl">?</span>
        </div>
      );
    return move === "COOPERATE" ? (
      <div className="w-20 h-20 rounded-2xl clay-block-mint flex items-center justify-center">
        <Shield className="w-10 h-10 text-white" />
      </div>
    ) : (
      <div className="w-20 h-20 rounded-2xl clay-block-coral flex items-center justify-center">
        <Skull className="w-10 h-10 text-white" />
      </div>
    );
  };

  return (
    <div className="relative p-8 rounded-3xl clay-block vibrant-grid">
      <div className="absolute top-6 left-1/2 -translate-x-1/2">
        <div className="clay-badge-coral">
          <span className="font-display text-sm text-white">
            {isCompleted ? `Round ${rounds.length} / ${rounds.length}` : `Round ${currentRound || rounds.length} / 7`}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-8 mt-12">
        <motion.div
          className="flex-1 text-center flex flex-col items-center"
          animate={{ x: phase === "reveal" ? 15 : 0 }}
        >
          <div className="mb-4 flex justify-center">
            <AIAvatar agent={player1} size="xl" className="clay-block-mint" />
          </div>
          <h3 className="font-display text-xl mb-2 text-[#4ECDC4]">
            {player1.shortName}
          </h3>
          <div className="clay-badge mb-4 inline-block">
            <span className="font-display text-2xl">{player1Score}</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentRound}-${player1Move}`}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className="flex justify-center"
            >
              <MoveIcon move={phase !== "thinking" ? player1Move : null} />
            </motion.div>
          </AnimatePresence>
          {player1Move && phase !== "thinking" && (
            <p className={`mt-3 font-display text-sm ${player1Move === "COOPERATE" ? "text-[#4ECDC4]" : "text-[#FF6B6B]"}`}>
              {player1Move}
            </p>
          )}
        </motion.div>

        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{
              rotate: phase === "reveal" ? [0, 360] : 0,
              scale: phase === "reveal" ? [1, 1.3, 1] : 1,
            }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 rounded-2xl clay-block-purple flex items-center justify-center"
          >
            <Swords className="w-8 h-8 text-white" />
          </motion.div>
          <span className="clay-badge text-sm">VS</span>
        </div>

        <motion.div
          className="flex-1 text-center flex flex-col items-center"
          animate={{ x: phase === "reveal" ? -15 : 0 }}
        >
          <div className="mb-4 flex justify-center">
            <AIAvatar agent={player2} size="xl" className="clay-block-coral" />
          </div>
          <h3 className="font-display text-xl mb-2 text-[#FF6B6B]">
            {player2.shortName}
          </h3>
          <div className="clay-badge mb-4 inline-block">
            <span className="font-display text-2xl">{player2Score}</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentRound}-${player2Move}`}
              initial={{ scale: 0, rotate: 180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, rotate: -180, opacity: 0 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
              className="flex justify-center"
            >
              <MoveIcon move={phase !== "thinking" && currentRoundData ? player2Move : null} />
            </motion.div>
          </AnimatePresence>
          {player2Move && phase !== "thinking" && currentRoundData && (
            <motion.p 
              className={`mt-3 font-display text-sm ${player2Move === "COOPERATE" ? "text-[#4ECDC4]" : "text-[#FF6B6B]"}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {player2Move}
            </motion.p>
          )}
        </motion.div>
      </div>

      <div className="mt-10">
        <h4 className="text-sm text-muted-foreground mb-3 flex items-center gap-2 font-semibold">
          <Sparkles className="w-4 h-4 text-[#FFE66D]" /> Match History
        </h4>
        <div className="flex gap-2 flex-wrap">
          {rounds.map((round, i) => (
            <div
              key={i}
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-display text-white
                ${round.player1Score > round.player2Score
                  ? "clay-block-mint"
                  : round.player2Score > round.player1Score
                    ? "clay-block-coral"
                    : "clay-block"
                }`}
            >
              {round.player1Score}-{round.player2Score}
            </div>
          ))}
        </div>
      </div>

      {phase === "thinking" && isLive && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-3xl z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="text-center">
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { repeat: Infinity, duration: 2, ease: "linear" },
                scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
              }}
              className="w-20 h-20 mx-auto mb-6 rounded-3xl clay-block-yellow flex items-center justify-center shadow-lg"
            >
              <motion.span 
                className="text-4xl"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1,
                  ease: "easeInOut"
                }}
              >
                🤔
              </motion.span>
            </motion.div>
            <motion.p 
              className="text-[#FF6B6B] font-display text-xl mb-2"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              AIs Thinking...
            </motion.p>
            <p className="text-sm text-muted-foreground font-medium">
              Analyzing opponent's strategy...
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
