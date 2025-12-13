import { PublicKey } from '@solana/web3.js';

export interface Market {
  publicKey: PublicKey;
  authority: PublicKey;
  pool: PublicKey;
  matchId: string;
  isSettled: boolean;
  winningAi: number;
  totalPool: bigint;
  optionPools: bigint[];
  createdAt: number;
}

export interface Bet {
  publicKey: PublicKey;
  user: PublicKey;
  market: PublicKey;
  ai: number;
  amount: bigint;
  claimed: boolean;
  timestamp: number;
}

export interface PlaceBetParams {
  marketAddress: PublicKey;
  aiIndex: number;
  amount: bigint;
}

export interface SettleMarketParams {
  marketAddress: PublicKey;
  winningAiIndex: number;
}

export interface ClaimWinningsParams {
  marketAddress: PublicKey;
  betAddress: PublicKey;
}

export interface MarketState {
  markets: Market[];
  userBets: Bet[];
  loading: boolean;
  error: string | null;
}

export const AI_INDEX_MAP: Record<string, number> = {
  chatgpt: 0,
  claude: 1,
  g3mini: 2,
  deepseek: 3,
  grok: 4,
};

export const INDEX_AI_MAP: Record<number, string> = Object.fromEntries(
  Object.entries(AI_INDEX_MAP).map(([k, v]) => [v, k])
);
