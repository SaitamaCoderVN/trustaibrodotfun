"use client";

import { useState, useCallback } from 'react';
import { AI_MODELS, Match, RoundResult } from '@/lib/types';
import { createDailyTournament, runDailyTournament, DailyTournament } from '@/lib/tournament';
import { getLocalAgentMove } from '@/lib/ai-strategies';

export function useTournament() {
  const [tournament, setTournament] = useState<DailyTournament | null>(null);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const initializeTournament = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const newTournament = createDailyTournament(`daily-${today}`, today, AI_MODELS);
    setTournament(newTournament);
    return newTournament;
  }, []);

  const runTournament = useCallback(async () => {
    if (isRunning) return;
    
    let activeTournament = tournament;
    if (!activeTournament) {
      activeTournament = initializeTournament();
    }

    setIsRunning(true);

    try {
      const result = await runDailyTournament(
        activeTournament,
        async (agentId, input) => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return getLocalAgentMove(agentId, input);
        },
        (match) => {
          setCurrentMatch(match);
        },
        (match) => {
          setCurrentMatch({ ...match });
        },
        (match) => {
          setCurrentMatch(null);
        }
      );

      setTournament(result);
    } finally {
      setIsRunning(false);
    }
  }, [tournament, isRunning, initializeTournament]);

  return {
    tournament,
    currentMatch,
    isRunning,
    initializeTournament,
    runTournament,
  };
}
