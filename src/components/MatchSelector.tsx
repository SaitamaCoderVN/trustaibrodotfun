"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AIModel, AI_MODELS } from "@/lib/types";
import { Play, X } from "lucide-react";
import { AIAvatar } from "./AIAvatar";

type MatchSelectorProps = {
  onMatchSelected: (player1: AIModel, player2: AIModel) => void;
  onStartBattle?: () => void;
  disabled?: boolean;
  canStartBattle?: boolean;
};

export function MatchSelector({ onMatchSelected, onStartBattle, disabled, canStartBattle = false }: MatchSelectorProps) {
  const [selectedPlayer1, setSelectedPlayer1] = useState<AIModel | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<AIModel | null>(null);

  const handleSelectPlayer1 = (agent: AIModel) => {
    if (disabled) return;
    if (selectedPlayer2?.id === agent.id) {
      setSelectedPlayer2(null);
    }
    setSelectedPlayer1(agent);
    // Notify parent when both are selected
    if (selectedPlayer2 && selectedPlayer2.id !== agent.id) {
      onMatchSelected(agent, selectedPlayer2);
    }
  };

  const handleSelectPlayer2 = (agent: AIModel) => {
    if (disabled) return;
    if (selectedPlayer1?.id === agent.id) {
      setSelectedPlayer1(null);
    }
    setSelectedPlayer2(agent);
    // Notify parent when both are selected
    if (selectedPlayer1 && selectedPlayer1.id !== agent.id) {
      onMatchSelected(selectedPlayer1, agent);
    }
  };

  const handleStartBattle = () => {
    if (onStartBattle) {
      onStartBattle();
    }
  };

  const canSelect = selectedPlayer1 && selectedPlayer2 && selectedPlayer1.id !== selectedPlayer2.id;

  return (
    <div className="p-6 rounded-3xl clay-block">
      <h3 className="font-display text-xl text-[#A66CFF] mb-6">
        Select AI Models to Battle
      </h3>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Player 1 Selection */}
        <div>
          <label className="text-sm text-muted-foreground font-semibold mb-3 block">
            Player 1
          </label>
          <div className="space-y-2">
            {AI_MODELS.map((agent) => (
              <motion.button
                key={agent.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectPlayer1(agent)}
                disabled={disabled || agent.id === selectedPlayer2?.id}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  selectedPlayer1?.id === agent.id
                    ? "clay-block-yellow"
                    : agent.id === selectedPlayer2?.id
                    ? "clay-block opacity-50 cursor-not-allowed"
                    : "clay-block hover:scale-105"
                }`}
              >
                <div className="flex items-center gap-3">
                  <AIAvatar agent={agent} size="md" />
                  <div className="flex-1">
                    <p className="font-display text-sm font-semibold">{agent.shortName}</p>
                    <p className="text-xs text-muted-foreground">{agent.strategy}</p>
                  </div>
                  {selectedPlayer1?.id === agent.id && (
                    <div className="w-5 h-5 rounded-full bg-[#4ECDC4] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Player 2 Selection */}
        <div>
          <label className="text-sm text-muted-foreground font-semibold mb-3 block">
            Player 2
          </label>
          <div className="space-y-2">
            {AI_MODELS.map((agent) => (
              <motion.button
                key={agent.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectPlayer2(agent)}
                disabled={disabled || agent.id === selectedPlayer1?.id}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  selectedPlayer2?.id === agent.id
                    ? "clay-block-coral"
                    : agent.id === selectedPlayer1?.id
                    ? "clay-block opacity-50 cursor-not-allowed"
                    : "clay-block hover:scale-105"
                }`}
              >
                <div className="flex items-center gap-3">
                  <AIAvatar agent={agent} size="md" />
                  <div className="flex-1">
                    <p className="font-display text-sm font-semibold">{agent.shortName}</p>
                    <p className="text-xs text-muted-foreground">{agent.strategy}</p>
                  </div>
                  {selectedPlayer2?.id === agent.id && (
                    <div className="w-5 h-5 rounded-full bg-[#FF6B6B] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Match Preview */}
      {selectedPlayer1 && selectedPlayer2 && (
        <div className="mb-6 p-4 rounded-2xl clay-block-yellow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AIAvatar agent={selectedPlayer1} size="lg" />
              <span className="text-muted-foreground font-display">VS</span>
              <AIAvatar agent={selectedPlayer2} size="lg" />
            </div>
            <button
              onClick={() => {
                setSelectedPlayer1(null);
                setSelectedPlayer2(null);
              }}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Start Battle Button - Only show when models are selected and can start */}
      {canSelect && (
        <motion.button
          whileHover={canStartBattle && !disabled ? { scale: 1.02 } : {}}
          whileTap={canStartBattle && !disabled ? { scale: 0.98 } : {}}
          onClick={handleStartBattle}
          disabled={!canStartBattle || disabled}
          className={`w-full py-4 rounded-2xl font-display text-lg flex items-center justify-center gap-2 transition-all ${
            canStartBattle && !disabled
              ? "clay-btn"
              : "clay-block opacity-50 cursor-not-allowed"
          }`}
        >
          <Play className="w-5 h-5" />
          Start Battle
        </motion.button>
      )}
    </div>
  );
}

