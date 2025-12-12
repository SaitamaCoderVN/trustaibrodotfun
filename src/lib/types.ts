export type AIModel = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  avatar: string;
  strategy: string;
  description: string;
  wins: number;
  losses: number;
  totalScore: number;
};

export type Move = 'COOPERATE' | 'DEFECT';

export type RoundResult = {
  round: number;
  player1Move: Move;
  player2Move: Move;
  player1Score: number;
  player2Score: number;
};

export type Match = {
  id: string;
  player1: AIModel;
  player2: AIModel;
  rounds: RoundResult[];
  status: 'pending' | 'in_progress' | 'completed';
  winner: AIModel | null;
  totalRounds: number;
  currentRound: number;
};

export type Tournament = {
  id: string;
  name: string;
  status: 'upcoming' | 'live' | 'completed';
  startTime: Date;
  endTime: Date | null;
  participants: AIModel[];
  matches: Match[];
  prizePool: number;
  currentMatch: Match | null;
};

export type Bet = {
  id: string;
  userId: string;
  tournamentId: string;
  matchId?: string;
  predictedWinner: string;
  amount: number;
  currency: 'SOL' | 'USDC';
  odds: number;
  status: 'pending' | 'won' | 'lost';
  potentialPayout: number;
  createdAt: Date;
};

export type Market = {
  id: string;
  tournamentId: string;
  matchId?: string;
  question: string;
  options: MarketOption[];
  totalVolume: number;
  status: 'open' | 'closed' | 'settled';
  expiresAt: Date;
};

export type MarketOption = {
  id: string;
  label: string;
  probability: number;
  totalBets: number;
  volume: number;
};

export const PAYOFF_MATRIX = {
  COOPERATE_COOPERATE: { player1: 3, player2: 3 },
  COOPERATE_DEFECT: { player1: 0, player2: 5 },
  DEFECT_COOPERATE: { player1: 5, player2: 0 },
  DEFECT_DEFECT: { player1: 1, player2: 1 },
};

export const AI_MODELS: AIModel[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT-4',
    shortName: 'GPT-4',
    color: '#10a37f',
    avatar: '/avatars/chatgpt.png',
    strategy: 'Adaptive Tit-for-Tat',
    description: 'OpenAI flagship model. Favors cooperation but retaliates against defection.',
    wins: 0,
    losses: 0,
    totalScore: 0,
  },
  {
    id: 'claude',
    name: 'Claude 3.5',
    shortName: 'Claude',
    color: '#d4a574',
    avatar: '/avatars/claude.png',
    strategy: 'Forgiving Cooperator',
    description: 'Anthropic model. Highly cooperative, forgives occasional defections.',
    wins: 0,
    losses: 0,
    totalScore: 0,
  },
  {
    id: 'gemini',
    name: 'Gemini Ultra',
    shortName: 'Gemini',
    color: '#4285f4',
    avatar: '/avatars/gemini.png',
    strategy: 'Strategic Analyzer',
    description: 'Google model. Analyzes patterns to maximize long-term score.',
    wins: 0,
    losses: 0,
    totalScore: 0,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek V3',
    shortName: 'DeepSeek',
    color: '#7c3aed',
    avatar: '/avatars/deepseek.png',
    strategy: 'Game Theory Optimal',
    description: 'Chinese model. Uses advanced game theory for optimal play.',
    wins: 0,
    losses: 0,
    totalScore: 0,
  },
  {
    id: 'llama',
    name: 'Llama 3.1',
    shortName: 'Llama',
    color: '#0668e1',
    avatar: '/avatars/llama.png',
    strategy: 'Random Cooperator',
    description: 'Meta model. Unpredictable with a cooperation bias.',
    wins: 0,
    losses: 0,
    totalScore: 0,
  },
  {
    id: 'grok',
    name: 'Grok-2',
    shortName: 'Grok',
    color: '#1da1f2',
    avatar: '/avatars/grok.png',
    strategy: 'Aggressive Defector',
    description: 'xAI model. Plays aggressively, frequent defection.',
    wins: 0,
    losses: 0,
    totalScore: 0,
  },
];
