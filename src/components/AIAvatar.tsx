"use client";

import { AIModel } from "@/lib/types";
import { useState } from "react";

type AIAvatarProps = {
  agent: AIModel;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showFallback?: boolean;
};

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
  xl: "w-24 h-24",
};

export function AIAvatar({ agent, size = "md", className = "", showFallback = true }: AIAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const sizeClass = sizeClasses[size];

  if (imageError && showFallback) {
    return (
      <div
        className={`${sizeClass} rounded-xl flex items-center justify-center font-display text-white ${className}`}
        style={{ backgroundColor: agent.color }}
      >
        <span className={size === "xl" ? "text-3xl" : size === "lg" ? "text-lg" : "text-sm"}>
          {agent.shortName.charAt(0)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-xl overflow-hidden flex items-center justify-center ${className}`}
      style={{ backgroundColor: agent.color }}
    >
      <img
        src={agent.avatar}
        alt={agent.name}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  );
}

