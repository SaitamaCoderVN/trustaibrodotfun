import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { marketAddress, winningAiIndex } = body;

  if (!marketAddress || winningAiIndex === undefined) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: 'Market settlement initiated',
    marketAddress,
    winningAiIndex,
    note: 'On-chain settlement requires Anchor program deployment',
  });
}
