import { AI_INDEX_MAP } from './betting-types';

export type YesNoMarket = {
  id: string;
  question: string;
  aiId: string;
  yesPool: number;
  noPool: number;
  totalVolume: number;
  yesPrice: number;
  noPrice: number;
  status: 'open' | 'closed' | 'settled';
  outcome?: 'yes' | 'no';
  expiresAt: Date;
  settledAt?: Date;
};

export type YesNoPosition = {
  marketId: string;
  userId: string;
  side: 'yes' | 'no';
  shares: number;
  avgPrice: number;
  cost: number;
};

export function calculatePrices(yesPool: number, noPool: number): { yesPrice: number; noPrice: number } {
  const total = yesPool + noPool;
  if (total === 0) {
    return { yesPrice: 0.5, noPrice: 0.5 };
  }
  return {
    yesPrice: noPool / total,
    noPrice: yesPool / total,
  };
}

export function createYesNoMarket(
  aiId: string,
  tournamentDate: string,
  expiresAt: Date
): YesNoMarket {
  const aiIndex = AI_INDEX_MAP[aiId] ?? 0;
  return {
    id: `${aiId}-winner-${tournamentDate}`,
    question: `Will ${aiId.toUpperCase()} win the daily tournament on ${tournamentDate}?`,
    aiId,
    yesPool: 0,
    noPool: 0,
    totalVolume: 0,
    yesPrice: 0.5,
    noPrice: 0.5,
    status: 'open',
    expiresAt,
  };
}

export function placeBinaryBet(
  market: YesNoMarket,
  side: 'yes' | 'no',
  amount: number
): { market: YesNoMarket; shares: number; price: number } {
  const updatedMarket = { ...market };
  
  if (side === 'yes') {
    updatedMarket.yesPool += amount;
  } else {
    updatedMarket.noPool += amount;
  }
  
  updatedMarket.totalVolume += amount;
  
  const prices = calculatePrices(updatedMarket.yesPool, updatedMarket.noPool);
  updatedMarket.yesPrice = prices.yesPrice;
  updatedMarket.noPrice = prices.noPrice;
  
  const price = side === 'yes' ? prices.yesPrice : prices.noPrice;
  const shares = amount / price;
  
  return {
    market: updatedMarket,
    shares,
    price,
  };
}

export function settleMarket(
  market: YesNoMarket,
  didWin: boolean
): YesNoMarket {
  return {
    ...market,
    status: 'settled',
    outcome: didWin ? 'yes' : 'no',
    settledAt: new Date(),
  };
}

export function calculatePayout(
  position: YesNoPosition,
  market: YesNoMarket
): number {
  if (market.status !== 'settled' || !market.outcome) {
    return 0;
  }
  
  if (position.side === market.outcome) {
    return position.shares;
  }
  
  return 0;
}

export function getOdds(price: number): number {
  if (price <= 0 || price >= 1) return 0;
  return 1 / price;
}

export function impliedProbability(price: number): number {
  return price * 100;
}
