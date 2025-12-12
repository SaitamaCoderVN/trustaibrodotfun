"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AIModel, Move, RoundResult, PAYOFF_MATRIX } from "@/lib/types";
import { useState, useEffect } from "react";
import { Swords, Shield, Skull, Sparkles } from "lucide-react";

type BattleArenaProps = {
  player1: AIModel;
  player2: AIModel;
  isLive?: boolean;
  onRoundComplete?: (result: RoundResult) => void;
};

export function BattleArena({
  player1,
  player2,
  isLive = false,
}: BattleArenaProps) {
  const [currentRound, setCurrentRound] = useState(1);
  const [player1Move, setPlayer1Move] = useState<Move | null>(null);
  const [player2Move, setPlayer2Move] = useState<Move | null>(null);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [phase, setPhase] = useState<"thinking" | "reveal" | "result">("thinking");
  const [history, setHistory] = useState<RoundResult[]>([]);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      if (phase === "thinking") {
        const moves: Move[] = ["COOPERATE", "DEFECT"];
        setPlayer1Move(moves[Math.floor(Math.random() * 2)]);
        setPlayer2Move(moves[Math.floor(Math.random() * 2)]);
        setPhase("reveal");
      } else if (phase === "reveal") {
        if (player1Move && player2Move) {
          const key = `${player1Move}_${player2Move}` as keyof typeof PAYOFF_MATRIX;
          const payoff = PAYOFF_MATRIX[key];
          setPlayer1Score((s) => s + payoff.player1);
          setPlayer2Score((s) => s + payoff.player2);
          setHistory((h) => [
            ...h,
            {
              round: currentRound,
              player1Move,
              player2Move,
              player1Score: payoff.player1,
              player2Score: payoff.player2,
            },
          ]);
        }
        setPhase("result");
      } else {
        setPlayer1Move(null);
        setPlayer2Move(null);
        setCurrentRound((r) => r + 1);
        setPhase("thinking");
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive, phase, player1Move, player2Move, currentRound]);

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
            Round {currentRound}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-8 mt-12">
        <motion.div
          className="flex-1 text-center"
          animate={{ x: phase === "reveal" ? 15 : 0 }}
        >
          <div
            className="w-24 h-24 mx-auto mb-4 rounded-3xl flex items-center justify-center clay-block-mint"
          >
            <span className="font-display text-3xl text-white">
              {player1.shortName.charAt(0)}
            </span>
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
          className="flex-1 text-center"
          animate={{ x: phase === "reveal" ? -15 : 0 }}
        >
          <div
            className="w-24 h-24 mx-auto mb-4 rounded-3xl flex items-center justify-center clay-block-coral"
          >
            <span className="font-display text-3xl text-white">
              {player2.shortName.charAt(0)}
            </span>
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
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -180 }}
              className="flex justify-center"
            >
              <MoveIcon move={phase !== "thinking" ? player2Move : null} />
            </motion.div>
          </AnimatePresence>
          {player2Move && phase !== "thinking" && (
            <p className={`mt-3 font-display text-sm ${player2Move === "COOPERATE" ? "text-[#4ECDC4]" : "text-[#FF6B6B]"}`}>
              {player2Move}
            </p>
          )}
        </motion.div>
      </div>

      <div className="mt-10">
        <h4 className="text-sm text-muted-foreground mb-3 flex items-center gap-2 font-semibold">
          <Sparkles className="w-4 h-4 text-[#FFE66D]" /> Match History
        </h4>
        <div className="flex gap-2 flex-wrap">
          {history.slice(-10).map((round, i) => (
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
          className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-4 rounded-2xl clay-block-yellow flex items-center justify-center"
            >
              <span className="text-2xl">🤔</span>
            </motion.div>
            <p className="text-[#FF6B6B] font-display text-lg">AIs Thinking...</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
