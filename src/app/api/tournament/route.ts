import { NextRequest, NextResponse } from 'next/server';
import { AI_MODELS } from '@/lib/types';
import { createDailyTournament, runDailyTournament, DailyTournament } from '@/lib/tournament';
import { getLocalAgentMove } from '@/lib/ai-strategies';

let currentTournament: DailyTournament | null = null;
let isRunning = false;

export async function GET() {
  return NextResponse.json({
    tournament: currentTournament,
    isRunning,
    participants: AI_MODELS,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === 'start') {
    if (isRunning) {
      return NextResponse.json({ error: 'Tournament already running' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    currentTournament = createDailyTournament(`daily-${today}`, today, AI_MODELS);
    isRunning = true;

    runDailyTournament(
      currentTournament,
      async (agentId, input) => {
        await new Promise((r) => setTimeout(r, 100));
        return getLocalAgentMove(agentId, input);
      }
    ).then((result) => {
      currentTournament = result;
      isRunning = false;
    }).catch(() => {
      isRunning = false;
    });

    return NextResponse.json({ success: true, tournament: currentTournament });
  }

  if (action === 'reset') {
    currentTournament = null;
    isRunning = false;
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
