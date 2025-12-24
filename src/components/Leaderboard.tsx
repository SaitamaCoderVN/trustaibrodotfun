"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { AIModel } from "@/lib/types";
import { Trophy, Medal, Crown, TrendingUp, Activity } from "lucide-react";
import { AIAvatar } from "./AIAvatar";

type LeaderboardProps = {
  agents: AIModel[];
};

const RANK_COLORS = ["pixel-box-yellow", "pixel-box", "pixel-box-orange"];

export function Leaderboard({ agents }: LeaderboardProps) {
  const sortedAgents = useMemo(() => {
    return [...agents].sort(
      (a, b) => b.totalScore - a.totalScore || b.wins - a.wins
    );
  }, [agents]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-6 h-6" />;
      case 1:
        return <Medal className="w-6 h-6" />;
      case 2:
        return <Medal className="w-6 h-6" />;
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center text-muted-foreground font-pixel text-sm">
            {index + 1}
          </span>
        );
    }
  };

  const getWinRate = (agent: AIModel) => {
    const total = agent.wins + agent.losses;
    if (total === 0) return 0;
    return ((agent.wins / total) * 100).toFixed(0);
  };

  return (
    <div className="p-6 pixel-box">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 pixel-box-yellow flex items-center justify-center">
          <Trophy className="w-6 h-6" />
        </div>
        <h3 className="font-pixel text-sm">
          LEADERBOARD
        </h3>
      </div>

      <div className="space-y-3">
        {sortedAgents.map((agent, index) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            whileHover={{ scale: 1.02, x: 4 }}
            className={`
              p-4 flex items-center gap-4 transition-all
              ${index < 3 ? RANK_COLORS[index] : "border-4 border-black bg-gray-50"}
            `}
          >
            <div className={`w-10 h-10 flex items-center justify-center ${index < 3 ? "bg-white/30" : "bg-gray-100"} border-2 border-black`}>
              {getRankIcon(index)}
            </div>

            <AIAvatar 
              agent={agent} 
              size="lg" 
              className={`border-4 border-black ${index < 3 ? "bg-white/30" : ""}`}
            />

            <div className="flex-1 min-w-0">
              <p 
                className={`font-pixel text-xs truncate ${index < 3 && index !== 1 ? "text-white" : ""}`}
                style={{ color: index >= 3 || index === 1 ? agent.color : undefined }}
              >
                {agent.shortName}
              </p>
              <p className={`font-pixel-body text-xs truncate ${index < 3 && index !== 1 ? "text-white/80" : "text-muted-foreground"}`}>
                {agent.strategy}
              </p>
            </div>

            <div className="text-right">
              <p className={`font-pixel text-lg ${index < 3 && index !== 1 ? "text-white" : "text-[var(--pixel-green)]"}`}>
                {agent.totalScore}
              </p>
              <div className={`flex items-center gap-1 font-pixel text-xs ${index < 3 && index !== 1 ? "text-white/80" : "text-muted-foreground"}`}>
                <Activity className="w-3 h-3" />
                <span>
                  {agent.wins}W-{agent.losses}L
                </span>
              </div>
            </div>

            <div className={`w-16 text-right p-2 border-2 border-black ${index < 3 ? "bg-white/20" : "bg-gray-100"}`}>
              <div className="flex items-center justify-end gap-1">
                <TrendingUp
                  className={`w-3 h-3 ${Number(getWinRate(agent)) >= 50 ? "text-[var(--pixel-green)]" : "text-[var(--pixel-pink)]"}`}
                />
                <span
                  className={`font-pixel text-xs ${Number(getWinRate(agent)) >= 50 ? "text-[var(--pixel-green)]" : "text-[var(--pixel-pink)]"}`}
                >
                  {getWinRate(agent)}%
                </span>
              </div>
              <p className={`font-pixel text-xs ${index < 3 && index !== 1 ? "text-white/70" : "text-muted-foreground"}`}>
                WIN
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
