"use client";

import { motion } from "framer-motion";
import { AIModel } from "@/lib/types";
import { Bot, Trophy, XCircle, Zap } from "lucide-react";
import { AIAvatar } from "./AIAvatar";

type AIAgentCardProps = {
  agent: AIModel;
  isActive?: boolean;
  showStats?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
};

const CLAY_COLORS: Record<string, string> = {
  "#10a37f": "clay-block-mint",
  "#cc785c": "clay-block-orange",
  "#4285f4": "clay-block-blue",
  "#536dfe": "clay-block-purple",
  "#0668e1": "clay-block-blue",
  "#1da1f2": "clay-block-coral",
};

export function AIAgentCard({
  agent,
  isActive = false,
  showStats = true,
  onClick,
  size = "md",
}: AIAgentCardProps) {
  const sizeClasses = {
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  };

  const clayClass = CLAY_COLORS[agent.color] || "clay-block";

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -6, rotate: 1 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-3xl cursor-pointer
        ${sizeClasses[size]}
        ${isActive ? clayClass : "clay-block"}
        transition-all duration-200
      `}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-4">
          <AIAvatar 
            agent={agent} 
            size="lg" 
            className={`block-shadow-sm ${isActive ? "bg-white/30" : ""}`}
          />
          <div>
            <h3
              className={`font-display text-xl ${isActive ? "text-white" : ""}`}
              style={{ color: isActive ? undefined : agent.color }}
            >
              {agent.shortName}
            </h3>
            <p className={`text-sm ${isActive ? "text-white/80" : "text-muted-foreground"}`}>
              {agent.name}
            </p>
          </div>
        </div>

        <div className={`mb-4 p-3 rounded-xl ${isActive ? "bg-white/20" : "bg-muted/50"}`}>
          <div className={`flex items-center gap-2 text-sm mb-1 ${isActive ? "text-white/80" : "text-muted-foreground"}`}>
            <Zap className="w-4 h-4" />
            <span className="font-semibold">Strategy</span>
          </div>
          <p 
            className={`text-base font-bold ${isActive ? "text-white" : ""}`}
            style={{ color: isActive ? undefined : agent.color }}
          >
            {agent.strategy}
          </p>
        </div>

        {showStats && (
          <div className={`grid grid-cols-3 gap-3 pt-4 border-t-2 ${isActive ? "border-white/30" : "border-border/50"}`}>
            <div className={`text-center p-2 rounded-xl ${isActive ? "bg-white/20" : "bg-[#4ECDC4]/10"}`}>
              <div className={`flex items-center justify-center gap-1 ${isActive ? "text-white" : "text-[#4ECDC4]"}`}>
                <Trophy className="w-4 h-4" />
                <span className="font-display text-lg">{agent.wins}</span>
              </div>
              <span className={`text-xs font-semibold ${isActive ? "text-white/80" : "text-muted-foreground"}`}>Wins</span>
            </div>
            <div className={`text-center p-2 rounded-xl ${isActive ? "bg-white/20" : "bg-[#FF6B6B]/10"}`}>
              <div className={`flex items-center justify-center gap-1 ${isActive ? "text-white" : "text-[#FF6B6B]"}`}>
                <XCircle className="w-4 h-4" />
                <span className="font-display text-lg">{agent.losses}</span>
              </div>
              <span className={`text-xs font-semibold ${isActive ? "text-white/80" : "text-muted-foreground"}`}>Losses</span>
            </div>
            <div className={`text-center p-2 rounded-xl ${isActive ? "bg-white/20" : "bg-[#A66CFF]/10"}`}>
              <span className={`font-display text-lg ${isActive ? "text-white" : "text-[#A66CFF]"}`}>
                {agent.totalScore}
              </span>
              <p className={`text-xs font-semibold ${isActive ? "text-white/80" : "text-muted-foreground"}`}>Score</p>
            </div>
          </div>
        )}
      </div>

      {isActive && (
        <motion.div
          className="absolute top-4 right-4"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <div className="w-3 h-3 rounded-full bg-white block-shadow-sm" />
        </motion.div>
      )}
    </motion.div>
  );
}
