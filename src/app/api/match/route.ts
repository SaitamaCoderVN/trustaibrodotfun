import { NextRequest, NextResponse } from 'next/server';
import { AI_MODELS, Match } from '@/lib/types';
import { runMatch, ROUNDS_PER_MATCH, AgentInput, AgentOutput } from '@/lib/game-engine';
import { getLocalAgentMove } from '@/lib/ai-strategies';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { player1Id, player2Id } = body;

  const player1 = AI_MODELS.find((a) => a.id === player1Id);
  const player2 = AI_MODELS.find((a) => a.id === player2Id);

  if (!player1 || !player2) {
    return NextResponse.json({ error: 'Invalid player IDs' }, { status: 400 });
  }

  const getMove = async (agentId: string, input: AgentInput): Promise<AgentOutput> => {
    return getLocalAgentMove(agentId, input);
  };

  const result = await runMatch(
    (input) => getMove(player1.id, input),
    (input) => getMove(player2.id, input)
  );

  const match: Match = {
    id: `match-${Date.now()}`,
    player1,
    player2,
    rounds: result.rounds,
    status: 'completed',
    winner:
      result.winner === 'player1'
        ? player1
        : result.winner === 'player2'
        ? player2
        : null,
    totalRounds: ROUNDS_PER_MATCH,
    currentRound: ROUNDS_PER_MATCH,
  };

  return NextResponse.json({
    match,
    player1TotalScore: result.player1TotalScore,
    player2TotalScore: result.player2TotalScore,
  });
}
