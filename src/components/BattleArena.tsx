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
      <div className="p-8 pixel-box">
        <p className="text-center text-muted-foreground font-pixel-body">Loading players...</p>
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
  const isWaitingForNextRound = isLive && !isCompleted && rounds.length < currentRound;
  const phase = isLive && !isCompleted 
    ? (isWaitingForNextRound ? "thinking" : currentRoundData ? "reveal" : "thinking")
    : isCompleted 
      ? "result" 
      : "thinking";

  const MoveIcon = ({ move }: { move: Move | null }) => {
    if (!move)
      return (
        <div className="w-20 h-20 pixel-box animate-pixel-pulse flex items-center justify-center">
          <span className="font-pixel text-2xl">?</span>
        </div>
      );
    return move === "COOPERATE" ? (
      <div className="w-20 h-20 pixel-box-green flex items-center justify-center">
        <Shield className="w-10 h-10" />
      </div>
    ) : (
      <div className="w-20 h-20 pixel-box-pink flex items-center justify-center">
        <Skull className="w-10 h-10 text-white" />
      </div>
    );
  };

  return (
    <div className="relative p-8 pixel-box pixel-dots">
      <div className="absolute top-6 left-1/2 -translate-x-1/2">
        <div className="pixel-badge">
          <span className="text-xs">
            {isCompleted ? `ROUND ${rounds.length} / ${rounds.length}` : `ROUND ${currentRound || rounds.length} / 7`}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-8 mt-12">
        <motion.div
          className="flex-1 text-center flex flex-col items-center"
          animate={{ x: phase === "reveal" ? 15 : 0 }}
        >
          <div className="mb-4 flex justify-center">
            <AIAvatar agent={player1} size="xl" className="pixel-box-green border-4 border-black" />
          </div>
          <h3 className="font-pixel text-sm mb-2 text-[var(--pixel-green)]">
            {player1.shortName}
          </h3>
          <div className="pixel-badge-yellow mb-4 inline-block">
            <span className="font-pixel text-lg">{player1Score}</span>
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
            <p className={`mt-3 font-pixel text-xs ${player1Move === "COOPERATE" ? "text-[var(--pixel-green)]" : "text-[var(--pixel-pink)]"}`}>
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
            className="w-16 h-16 pixel-box-purple flex items-center justify-center"
          >
            <Swords className="w-8 h-8 text-white" />
          </motion.div>
          <span className="pixel-badge text-xs">VS</span>
        </div>

        <motion.div
          className="flex-1 text-center flex flex-col items-center"
          animate={{ x: phase === "reveal" ? -15 : 0 }}
        >
          <div className="mb-4 flex justify-center">
            <AIAvatar agent={player2} size="xl" className="pixel-box-pink border-4 border-black" />
          </div>
          <h3 className="font-pixel text-sm mb-2 text-[var(--pixel-pink)]">
            {player2.shortName}
          </h3>
          <div className="pixel-badge-yellow mb-4 inline-block">
            <span className="font-pixel text-lg">{player2Score}</span>
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
              className={`mt-3 font-pixel text-xs ${player2Move === "COOPERATE" ? "text-[var(--pixel-green)]" : "text-[var(--pixel-pink)]"}`}
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
        <h4 className="font-pixel text-xs text-muted-foreground mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--pixel-yellow)]" /> MATCH HISTORY
        </h4>
        <div className="flex gap-2 flex-wrap">
          {rounds.map((round, i) => (
            <div
              key={i}
              className={`w-12 h-12 flex items-center justify-center font-pixel text-xs
                ${round.player1Score > round.player2Score
                  ? "pixel-box-green"
                  : round.player2Score > round.player1Score
                    ? "pixel-box-pink"
                    : "pixel-box"
                }`}
            >
              {round.player1Score}-{round.player2Score}
            </div>
          ))}
        </div>
      </div>

      {phase === "thinking" && isLive && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-white/95 z-10"
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
              className="w-20 h-20 mx-auto mb-6 pixel-box-yellow flex items-center justify-center"
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
              className="text-[var(--pixel-pink)] font-pixel text-sm mb-2"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              AIs THINKING...
            </motion.p>
            <p className="font-pixel-body text-muted-foreground">
              Analyzing opponent&apos;s strategy...
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
