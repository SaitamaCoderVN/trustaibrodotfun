"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { AIModel } from "@/lib/types";
import { Trophy, Medal, Crown, TrendingUp, Activity } from "lucide-react";
import { AIAvatar } from "./AIAvatar";

type LeaderboardProps = {
  agents: AIModel[];
};

const RANK_COLORS = ["clay-block-yellow", "clay-block", "clay-block-orange"];

export function Leaderboard({ agents }: LeaderboardProps) {
  // Use useMemo to ensure consistent sorting between server and client
  const sortedAgents = useMemo(() => {
    return [...agents].sort(
      (a, b) => b.totalScore - a.totalScore || b.wins - a.wins
    );
  }, [agents]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-6 h-6 text-white drop-shadow-md" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-600" />;
      case 2:
        return <Medal className="w-6 h-6 text-white drop-shadow-md" />;
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center text-muted-foreground font-display text-lg">
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
    <div className="p-6 rounded-3xl clay-block">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl clay-block-yellow flex items-center justify-center">
          <Trophy className="w-6 h-6 text-white drop-shadow-md" />
        </div>
        <h3 className="font-display text-2xl text-[#FF9F45]">
          Leaderboard
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
              p-4 rounded-2xl flex items-center gap-4 transition-all
              ${index < 3 ? RANK_COLORS[index] : "clay-block"}
            `}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${index < 3 ? "bg-white/30" : "bg-muted/50"}`}>
              {getRankIcon(index)}
            </div>

            <AIAvatar 
              agent={agent} 
              size="lg" 
              className={index < 3 ? "bg-white/30" : ""}
            />

            <div className="flex-1 min-w-0">
              <p 
                className={`font-display text-lg truncate ${index < 3 ? (index === 1 ? "text-foreground" : "text-white") : ""}`}
                style={{ color: index >= 3 ? agent.color : undefined }}
              >
                {agent.shortName}
              </p>
              <p className={`text-xs truncate ${index < 3 ? (index === 1 ? "text-muted-foreground" : "text-white/80") : "text-muted-foreground"}`}>
                {agent.strategy}
              </p>
            </div>

            <div className="text-right">
              <p className={`font-display text-xl ${index < 3 ? (index === 1 ? "text-[#4ECDC4]" : "text-white") : "text-[#4ECDC4]"}`}>
                {agent.totalScore}
              </p>
              <div className={`flex items-center gap-1 text-xs ${index < 3 ? (index === 1 ? "text-muted-foreground" : "text-white/80") : "text-muted-foreground"}`}>
                <Activity className="w-3 h-3" />
                <span className="font-semibold">
                  {agent.wins}W-{agent.losses}L
                </span>
              </div>
            </div>

            <div className={`w-16 text-right p-2 rounded-xl ${index < 3 ? "bg-white/20" : "bg-muted/30"}`}>
              <div className="flex items-center justify-end gap-1">
                <TrendingUp
                  className={`w-3 h-3 ${Number(getWinRate(agent)) >= 50 ? "text-[#4ECDC4]" : "text-[#FF6B6B]"}`}
                />
                <span
                  className={`font-display ${Number(getWinRate(agent)) >= 50 ? "text-[#4ECDC4]" : "text-[#FF6B6B]"}`}
                >
                  {getWinRate(agent)}%
                </span>
              </div>
              <p className={`text-[10px] ${index < 3 ? (index === 1 ? "text-muted-foreground" : "text-white/70") : "text-muted-foreground"}`}>
                Win Rate
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
