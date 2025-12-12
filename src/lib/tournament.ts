import { AIModel, Match, Tournament, RoundResult } from './types';
import {
  runMatch,
  generateRoundRobinPairings,
  calculateTournamentPoints,
  AgentInput,
  AgentOutput,
  ROUNDS_PER_MATCH,
  TournamentPoints,
} from './game-engine';

export type DailyTournament = {
  id: string;
  date: string;
  status: 'pending' | 'in_progress' | 'completed';
  participants: AIModel[];
  matches: Match[];
  standings: TournamentPoints[];
  topTwoQualifiers: AIModel[];
  finalMatch?: Match;
};

export type WeeklyTournament = {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: 'pending' | 'in_progress' | 'completed';
  dailyResults: { date: string; standings: TournamentPoints[] }[];
  qualifiedAgents: AIModel[];
  finalMatches: Match[];
  champion?: AIModel;
};

export function createDailyTournament(
  id: string,
  date: string,
  participants: AIModel[]
): DailyTournament {
  const pairings = generateRoundRobinPairings(participants);
  
  const matches: Match[] = pairings.map(([p1, p2], index) => ({
    id: `${id}-match-${index + 1}`,
    player1: p1,
    player2: p2,
    rounds: [],
    status: 'pending',
    winner: null,
    totalRounds: ROUNDS_PER_MATCH,
    currentRound: 0,
  }));

  return {
    id,
    date,
    status: 'pending',
    participants,
    matches,
    standings: [],
    topTwoQualifiers: [],
  };
}

export async function runDailyTournament(
  tournament: DailyTournament,
  getAgentMove: (agentId: string, input: AgentInput) => Promise<AgentOutput>,
  onMatchStart?: (match: Match) => void,
  onRoundComplete?: (match: Match, round: RoundResult) => void,
  onMatchComplete?: (match: Match) => void
): Promise<DailyTournament> {
  const updatedTournament = { ...tournament, status: 'in_progress' as const };
  const completedMatches: Match[] = [];
  const matchResults: {
    player1Id: string;
    player2Id: string;
    winner: 'player1' | 'player2' | 'draw';
    player1Score: number;
    player2Score: number;
  }[] = [];

  for (const match of updatedTournament.matches) {
    const currentMatch = { ...match, status: 'in_progress' as const };
    onMatchStart?.(currentMatch);

    const result = await runMatch(
      (input) => getAgentMove(match.player1.id, input),
      (input) => getAgentMove(match.player2.id, input),
      (round) => {
        currentMatch.rounds.push(round);
        currentMatch.currentRound = round.round;
        onRoundComplete?.(currentMatch, round);
      }
    );

    const completedMatch: Match = {
      ...currentMatch,
      rounds: result.rounds,
      status: 'completed',
      currentRound: ROUNDS_PER_MATCH,
      winner:
        result.winner === 'player1'
          ? match.player1
          : result.winner === 'player2'
          ? match.player2
          : null,
    };

    completedMatches.push(completedMatch);
    matchResults.push({
      player1Id: match.player1.id,
      player2Id: match.player2.id,
      winner: result.winner,
      player1Score: result.player1TotalScore,
      player2Score: result.player2TotalScore,
    });

    onMatchComplete?.(completedMatch);
  }

  const standingsMap = calculateTournamentPoints(matchResults);
  const standings = Array.from(standingsMap.values()).sort(
    (a, b) => b.points - a.points || b.totalScore - a.totalScore
  );

  const topTwoQualifiers = standings
    .slice(0, 2)
    .map((s) => updatedTournament.participants.find((p) => p.id === s.agentId)!)
    .filter(Boolean);

  return {
    ...updatedTournament,
    matches: completedMatches,
    standings,
    topTwoQualifiers,
    status: 'completed',
  };
}

export function createWeeklyTournament(
  id: string,
  weekStart: string,
  weekEnd: string
): WeeklyTournament {
  return {
    id,
    weekStart,
    weekEnd,
    status: 'pending',
    dailyResults: [],
    qualifiedAgents: [],
    finalMatches: [],
  };
}

export function qualifyAgentsForWeekly(
  dailyResults: { date: string; standings: TournamentPoints[] }[],
  allAgents: AIModel[]
): AIModel[] {
  const cumulativeScores = new Map<string, number>();

  for (const day of dailyResults) {
    for (const standing of day.standings) {
      const current = cumulativeScores.get(standing.agentId) || 0;
      cumulativeScores.set(standing.agentId, current + standing.points);
    }
  }

  const sorted = Array.from(cumulativeScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return sorted
    .map(([agentId]) => allAgents.find((a) => a.id === agentId)!)
    .filter(Boolean);
}

export type WeeklyFinalResult = {
  player1: AIModel;
  player2: AIModel;
  player1Wins: number;
  player2Wins: number;
  matches: Match[];
  winner: AIModel | null;
};

export async function runWeeklyFinal(
  player1: AIModel,
  player2: AIModel,
  getAgentMove: (agentId: string, input: AgentInput) => Promise<AgentOutput>,
  onMatchComplete?: (matchNum: number, result: Match) => void
): Promise<WeeklyFinalResult> {
  const matches: Match[] = [];
  let player1Wins = 0;
  let player2Wins = 0;

  for (let matchNum = 1; matchNum <= 5; matchNum++) {
    if (player1Wins >= 3 || player2Wins >= 3) break;

    const matchId = `weekly-final-match-${matchNum}`;
    const match: Match = {
      id: matchId,
      player1,
      player2,
      rounds: [],
      status: 'in_progress',
      winner: null,
      totalRounds: ROUNDS_PER_MATCH,
      currentRound: 0,
    };

    const result = await runMatch(
      (input) => getAgentMove(player1.id, input),
      (input) => getAgentMove(player2.id, input)
    );

    const completedMatch: Match = {
      ...match,
      rounds: result.rounds,
      status: 'completed',
      currentRound: ROUNDS_PER_MATCH,
      winner:
        result.winner === 'player1'
          ? player1
          : result.winner === 'player2'
          ? player2
          : null,
    };

    matches.push(completedMatch);

    if (result.winner === 'player1') player1Wins++;
    else if (result.winner === 'player2') player2Wins++;

    onMatchComplete?.(matchNum, completedMatch);
  }

  let winner: AIModel | null = null;
  if (player1Wins > player2Wins) winner = player1;
  else if (player2Wins > player1Wins) winner = player2;

  return {
    player1,
    player2,
    player1Wins,
    player2Wins,
    matches,
    winner,
  };
}
