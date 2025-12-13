import { AgentInput, AgentOutput } from './game-engine';

export type AIStrategy = (input: AgentInput) => AgentOutput;

export const strategies: Record<string, AIStrategy> = {
  chatgpt: (input) => {
    if (input.round === 1) {
      return { move: 'C', reason: 'Start with cooperation to establish trust' };
    }
    if (input.opponent_last_move === 'D') {
      const recentDefects = input.history.slice(-3).filter((h) => h.op === 'D').length;
      if (recentDefects >= 2) {
        return { move: 'D', reason: 'Opponent is defecting consistently, retaliate' };
      }
    }
    return { move: 'C', reason: 'Continue cooperation' };
  },

  claude: (input) => {
    if (input.round === 1) {
      return { move: 'C', reason: 'Always start with good faith cooperation' };
    }
    const defections = input.history.filter((h) => h.op === 'D').length;
    const cooperations = input.history.filter((h) => h.op === 'C').length;
    if (defections > cooperations * 2) {
      return { move: 'D', reason: 'Opponent is too aggressive, must protect score' };
    }
    return { move: 'C', reason: 'Forgive and cooperate' };
  },

  g3mini: (input) => {
    if (input.round <= 2) {
      return { move: 'C', reason: 'Efficient: Quick trust establishment' };
    }
    const recentHistory = input.history.slice(-4);
    const opDefects = recentHistory.filter((h) => h.op === 'D').length;
    const opCooperates = recentHistory.filter((h) => h.op === 'C').length;
    if (opDefects > opCooperates) {
      return { move: 'D', reason: 'Efficient: Pattern detected, switch strategy' };
    }
    if (input.round > 40) {
      return { move: 'D', reason: 'Efficient: End-game optimization' };
    }
    return { move: 'C', reason: 'Efficient: Maintain cooperation' };
  },

  deepseek: (input) => {
    if (input.round === 1) {
      return { move: 'C', reason: 'GTO: Cooperate to signal willingness' };
    }
    if (input.round === 2 && input.opponent_last_move === 'D') {
      return { move: 'D', reason: 'GTO: Punish first-round defection' };
    }
    const last3 = input.history.slice(-3);
    const mutualCooperation = last3.every((h) => h.self === 'C' && h.op === 'C');
    if (mutualCooperation && input.round > 40) {
      return { move: 'D', reason: 'GTO: Exploit end-game trust' };
    }
    return { move: input.opponent_last_move === 'D' ? 'D' : 'C', reason: 'GTO: Tit-for-tat with analysis' };
  },

  grok: (input) => {
    if (input.round === 1) {
      return { move: 'D', reason: 'Aggressive: Test opponent resolve' };
    }
    const opCooperates = input.history.filter((h) => h.op === 'C').length;
    if (opCooperates > input.history.length * 0.8) {
      return { move: 'D', reason: 'Exploit cooperative opponent' };
    }
    if (input.opponent_last_move === 'D') {
      return { move: 'D', reason: 'Match aggression' };
    }
    const rand = Math.random();
    return { move: rand < 0.6 ? 'D' : 'C', reason: 'Aggressive with occasional cooperation' };
  },
};

export function getLocalAgentMove(agentId: string, input: AgentInput): AgentOutput {
  const strategy = strategies[agentId];
  if (strategy) {
    return strategy(input);
  }
  return { move: 'C', reason: 'Unknown agent, defaulting to cooperation' };
}
