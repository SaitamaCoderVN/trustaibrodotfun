import { NextRequest, NextResponse } from 'next/server';
import { AI_MODELS } from '@/lib/types';
import { createYesNoMarket, placeBinaryBet, YesNoMarket } from '@/lib/solana/kalshi-markets';

const markets = new Map<string, YesNoMarket>();
const userPositions = new Map<string, { marketId: string; side: 'yes' | 'no'; shares: number; cost: number }[]>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const marketId = searchParams.get('marketId');
  const userId = searchParams.get('userId');

  if (marketId) {
    const market = markets.get(marketId);
    return NextResponse.json({ market: market || null });
  }

  if (userId) {
    const positions = userPositions.get(userId) || [];
    return NextResponse.json({ positions });
  }

  return NextResponse.json({ 
    markets: Array.from(markets.values()),
    totalMarkets: markets.size 
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, aiId, side, amount, userId, tournamentDate } = body;

  if (action === 'create_market') {
    if (!aiId || !tournamentDate) {
      return NextResponse.json({ error: 'Missing aiId or tournamentDate' }, { status: 400 });
    }

    const agent = AI_MODELS.find(a => a.id === aiId);
    if (!agent) {
      return NextResponse.json({ error: 'Invalid AI agent' }, { status: 400 });
    }

    const expiresAt = new Date(tournamentDate);
    expiresAt.setHours(23, 59, 59, 999);

    const market = createYesNoMarket(aiId, tournamentDate, expiresAt);
    markets.set(market.id, market);

    return NextResponse.json({ success: true, market });
  }

  if (action === 'place_bet') {
    if (!aiId || !side || !amount || !userId || !tournamentDate) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const marketId = `${aiId}-winner-${tournamentDate}`;
    let market = markets.get(marketId);

    if (!market) {
      const expiresAt = new Date(tournamentDate);
      expiresAt.setHours(23, 59, 59, 999);
      market = createYesNoMarket(aiId, tournamentDate, expiresAt);
      markets.set(marketId, market);
    }

    if (market.status !== 'open') {
      return NextResponse.json({ error: 'Market is not open for betting' }, { status: 400 });
    }

    const result = placeBinaryBet(market, side, amount);
    markets.set(marketId, result.market);

    const userPos = userPositions.get(userId) || [];
    userPos.push({
      marketId,
      side,
      shares: result.shares,
      cost: amount,
    });
    userPositions.set(userId, userPos);

    return NextResponse.json({
      success: true,
      market: result.market,
      position: {
        shares: result.shares,
        price: result.price,
        cost: amount,
      },
    });
  }

  if (action === 'settle') {
    if (!aiId || !tournamentDate || body.didWin === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const marketId = `${aiId}-winner-${tournamentDate}`;
    const market = markets.get(marketId);

    if (!market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    const settledMarket: YesNoMarket = {
      ...market,
      status: 'settled',
      outcome: body.didWin ? 'yes' : 'no',
      settledAt: new Date(),
    };
    markets.set(marketId, settledMarket);

    return NextResponse.json({ success: true, market: settledMarket });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
