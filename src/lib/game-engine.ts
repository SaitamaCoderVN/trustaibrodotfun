import { Move, RoundResult, AIModel, PAYOFF_MATRIX } from './types';

export const ROUNDS_PER_MATCH = 7;

export interface AgentInput {
  opponent_last_move: 'C' | 'D' | null;
  round: number;
  history: { self: 'C' | 'D'; op: 'C' | 'D' }[];
}

export interface AgentOutput {
  move: 'C' | 'D';
  reason?: string;
}

export function calculateScores(
  player1Move: Move,
  player2Move: Move
): { player1Score: number; player2Score: number } {
  const key = `${player1Move}_${player2Move}` as keyof typeof PAYOFF_MATRIX;
  return {
    player1Score: PAYOFF_MATRIX[key].player1,
    player2Score: PAYOFF_MATRIX[key].player2,
  };
}

export function moveToShort(move: Move): 'C' | 'D' {
  return move === 'COOPERATE' ? 'C' : 'D';
}

export function shortToMove(short: 'C' | 'D'): Move {
  return short === 'C' ? 'COOPERATE' : 'DEFECT';
}

export function buildAgentInput(
  history: RoundResult[],
  currentRound: number,
  isPlayer1: boolean
): AgentInput {
  const agentHistory = history.map((r) => ({
    self: moveToShort(isPlayer1 ? r.player1Move : r.player2Move),
    op: moveToShort(isPlayer1 ? r.player2Move : r.player1Move),
  }));

  const lastOpMove = history.length > 0
    ? moveToShort(isPlayer1 ? history[history.length - 1].player2Move : history[history.length - 1].player1Move)
    : null;

  return {
    opponent_last_move: lastOpMove,
    round: currentRound,
    history: agentHistory,
  };
}

export function parseAgentOutput(output: unknown): AgentOutput {
  if (typeof output === 'object' && output !== null) {
    const obj = output as Record<string, unknown>;
    if (obj.move === 'C' || obj.move === 'D') {
      return {
        move: obj.move,
        reason: typeof obj.reason === 'string' ? obj.reason : undefined,
      };
    }
  }
  return { move: 'D', reason: 'Invalid output, defaulting to DEFECT' };
}

export function validateAgentOutput(output: unknown): boolean {
  if (typeof output !== 'object' || output === null) return false;
  const obj = output as Record<string, unknown>;
  return obj.move === 'C' || obj.move === 'D';
}

export interface MatchResult {
  rounds: RoundResult[];
  player1TotalScore: number;
  player2TotalScore: number;
  winner: 'player1' | 'player2' | 'draw';
}

export async function runMatch(
  getPlayer1Move: (input: AgentInput) => Promise<AgentOutput>,
  getPlayer2Move: (input: AgentInput) => Promise<AgentOutput>,
  onRoundComplete?: (round: RoundResult) => void
): Promise<MatchResult> {
  const rounds: RoundResult[] = [];
  let player1TotalScore = 0;
  let player2TotalScore = 0;

  for (let roundNum = 1; roundNum <= ROUNDS_PER_MATCH; roundNum++) {
    const player1Input = buildAgentInput(rounds, roundNum, true);
    const player2Input = buildAgentInput(rounds, roundNum, false);

    // Get moves from both players (with delay for "thinking" visualization)
    const [player1Output, player2Output] = await Promise.all([
      getPlayer1Move(player1Input).catch(() => ({ move: 'D' as const })),
      getPlayer2Move(player2Input).catch(() => ({ move: 'D' as const })),
    ]);

    const player1Move = shortToMove(player1Output.move);
    const player2Move = shortToMove(player2Output.move);
    const { player1Score, player2Score } = calculateScores(player1Move, player2Move);

    const roundResult: RoundResult = {
      round: roundNum,
      player1Move,
      player2Move,
      player1Score,
      player2Score,
    };

    rounds.push(roundResult);
    player1TotalScore += player1Score;
    player2TotalScore += player2Score;

    // Call onRoundComplete callback (which may include delay)
    if (onRoundComplete) {
      await onRoundComplete(roundResult);
    }
  }

  let winner: 'player1' | 'player2' | 'draw';
  if (player1TotalScore > player2TotalScore) {
    winner = 'player1';
  } else if (player2TotalScore > player1TotalScore) {
    winner = 'player2';
  } else {
    winner = 'draw';
  }

  return {
    rounds,
    player1TotalScore,
    player2TotalScore,
    winner,
  };
}

export type TournamentPoints = {
  agentId: string;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  totalScore: number;
};

export function calculateTournamentPoints(
  results: { player1Id: string; player2Id: string; winner: 'player1' | 'player2' | 'draw'; player1Score: number; player2Score: number }[]
): Map<string, TournamentPoints> {
  const standings = new Map<string, TournamentPoints>();

  for (const result of results) {
    if (!standings.has(result.player1Id)) {
      standings.set(result.player1Id, { agentId: result.player1Id, wins: 0, draws: 0, losses: 0, points: 0, totalScore: 0 });
    }
    if (!standings.has(result.player2Id)) {
      standings.set(result.player2Id, { agentId: result.player2Id, wins: 0, draws: 0, losses: 0, points: 0, totalScore: 0 });
    }

    const p1 = standings.get(result.player1Id)!;
    const p2 = standings.get(result.player2Id)!;

    p1.totalScore += result.player1Score;
    p2.totalScore += result.player2Score;

    if (result.winner === 'player1') {
      p1.wins += 1;
      p1.points += 3;
      p2.losses += 1;
    } else if (result.winner === 'player2') {
      p2.wins += 1;
      p2.points += 3;
      p1.losses += 1;
    } else {
      p1.draws += 1;
      p2.draws += 1;
      p1.points += 1;
      p2.points += 1;
    }
  }

  return standings;
}

export function generateRoundRobinPairings<T>(participants: T[]): [T, T][] {
  const pairings: [T, T][] = [];
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      pairings.push([participants[i], participants[j]]);
    }
  }
  return pairings;
}
