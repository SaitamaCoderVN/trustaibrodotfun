"use client";

import { useState, useCallback } from "react";
import { AIModel, Match } from "@/lib/types";
import { runMatch, MatchResult } from "@/lib/game-engine";
import { getLocalAgentMove } from "@/lib/ai-strategies";
import { useBettingClient } from "@/lib/solana/betting-client";

export function useMatchBattle() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const bettingClient = useBettingClient();

  const runBattle = useCallback(
    async (player1: AIModel, player2: AIModel, matchId: string) => {
      if (isRunning) return;

      setIsRunning(true);
      setMatchResult(null);

      // Create initial match
      const match: Match = {
        id: matchId,
        player1,
        player2,
        rounds: [],
        status: "in_progress",
        winner: null,
        totalRounds: 7,
        currentRound: 0,
      };
      setCurrentMatch(match);

      try {
        // Run the match with slower pace to show AI thinking
        const result = await runMatch(
          async (input) => {
            // Show "AI thinking" for 1.5-2 seconds
            await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 500));
            return getLocalAgentMove(player1.id, input);
          },
          async (input) => {
            // Show "AI thinking" for 1.5-2 seconds
            await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 500));
            return getLocalAgentMove(player2.id, input);
          },
          async (round) => {
            // Update match with each round
            setCurrentMatch((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                rounds: [...prev.rounds, round],
                currentRound: round.round,
              };
            });
            
            // Delay before next round to show the result (1.5 seconds)
            if (round.round < 7) {
              await new Promise((resolve) => setTimeout(resolve, 1500));
            }
          }
        );

        // Determine winner
        let winner: AIModel | null = null;
        if (result.winner === "player1") {
          winner = player1;
        } else if (result.winner === "player2") {
          winner = player2;
        }

        // Update match with final result
        const completedMatch: Match = {
          ...match,
          rounds: result.rounds,
          status: "completed",
          winner,
          currentRound: 7,
        };
        setCurrentMatch(completedMatch);
        setMatchResult(result);

        // Settle market on-chain
        if (bettingClient) {
          try {
            // Determine winning AI index: 0 for player1, 1 for player2, 255 for draw
            let winningAi: number;
            if (result.winner === "player1") {
              winningAi = 0;
            } else if (result.winner === "player2") {
              winningAi = 1;
            } else {
              // Draw - use 255 to indicate draw (all users can claim refund)
              winningAi = 255;
            }

            await bettingClient.settleMarket(matchId, winningAi);
          } catch (error: any) {
            console.error("Error settling market:", error);
            // Don't throw - match completed even if settlement fails
            // User can manually settle later
          }
        }

        return { match: completedMatch, result };
      } catch (error) {
        console.error("Error running battle:", error);
        throw error;
      } finally {
        setIsRunning(false);
      }
    },
    [isRunning, bettingClient]
  );

  const reset = useCallback(() => {
    setCurrentMatch(null);
    setMatchResult(null);
    setIsRunning(false);
  }, []);

  return {
    isRunning,
    currentMatch,
    matchResult,
    runBattle,
    reset,
  };
}

