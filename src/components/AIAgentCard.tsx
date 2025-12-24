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

const PIXEL_COLORS: Record<string, string> = {
  "#10a37f": "pixel-box-green",
  "#cc785c": "pixel-box-orange",
  "#4285f4": "pixel-box-blue",
  "#536dfe": "pixel-box-purple",
  "#0668e1": "pixel-box-blue",
  "#1da1f2": "pixel-box-pink",
  "#d4a574": "pixel-box-orange",
  "#7c3aed": "pixel-box-purple",
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

  const pixelClass = PIXEL_COLORS[agent.color] || "pixel-box";

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative overflow-hidden cursor-pointer
        ${sizeClasses[size]}
        ${isActive ? pixelClass : "pixel-box"}
        transition-all duration-200
      `}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-4">
          <AIAvatar 
            agent={agent} 
            size="lg" 
            className={`border-4 border-black ${isActive ? "bg-white/30" : ""}`}
          />
          <div>
            <h3
              className={`font-pixel text-sm ${isActive ? "text-white" : ""}`}
              style={{ color: isActive ? undefined : agent.color }}
            >
              {agent.shortName}
            </h3>
            <p className={`font-pixel-body text-sm ${isActive ? "text-white/80" : "text-muted-foreground"}`}>
              {agent.name}
            </p>
          </div>
        </div>

        <div className={`mb-4 p-3 border-4 border-black ${isActive ? "bg-white/20" : "bg-gray-50"}`}>
          <div className={`flex items-center gap-2 text-xs mb-1 ${isActive ? "text-white/80" : "text-muted-foreground"}`}>
            <Zap className="w-4 h-4" />
            <span className="font-pixel text-xs">STRATEGY</span>
          </div>
          <p 
            className={`font-pixel-body ${isActive ? "text-white" : ""}`}
            style={{ color: isActive ? undefined : agent.color }}
          >
            {agent.strategy}
          </p>
        </div>

        {showStats && (
          <div className={`grid grid-cols-3 gap-3 pt-4 border-t-4 ${isActive ? "border-white/30" : "border-black"}`}>
            <div className={`text-center p-2 border-4 border-black ${isActive ? "bg-white/20" : "bg-[var(--pixel-green)]/10"}`}>
              <div className={`flex items-center justify-center gap-1 ${isActive ? "text-white" : "text-[var(--pixel-green)]"}`}>
                <Trophy className="w-4 h-4" />
                <span className="font-pixel text-sm">{agent.wins}</span>
              </div>
              <span className={`font-pixel text-xs ${isActive ? "text-white/80" : "text-muted-foreground"}`}>WINS</span>
            </div>
            <div className={`text-center p-2 border-4 border-black ${isActive ? "bg-white/20" : "bg-[var(--pixel-pink)]/10"}`}>
              <div className={`flex items-center justify-center gap-1 ${isActive ? "text-white" : "text-[var(--pixel-pink)]"}`}>
                <XCircle className="w-4 h-4" />
                <span className="font-pixel text-sm">{agent.losses}</span>
              </div>
              <span className={`font-pixel text-xs ${isActive ? "text-white/80" : "text-muted-foreground"}`}>LOSS</span>
            </div>
            <div className={`text-center p-2 border-4 border-black ${isActive ? "bg-white/20" : "bg-[var(--pixel-purple)]/10"}`}>
              <span className={`font-pixel text-sm ${isActive ? "text-white" : "text-[var(--pixel-purple)]"}`}>
                {agent.totalScore}
              </span>
              <p className={`font-pixel text-xs ${isActive ? "text-white/80" : "text-muted-foreground"}`}>PTS</p>
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
          <div className="w-3 h-3 bg-white border-2 border-black" />
        </motion.div>
      )}
    </motion.div>
  );
}
