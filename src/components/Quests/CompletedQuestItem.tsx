// src/components/Quests/CompletedQuestItem.tsx
// Compact list item for completed quests

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { Quest, Skill } from "@/types";

interface CompletedQuestItemProps {
  quest: Quest;
  skill: Skill | undefined;
}

export function CompletedQuestItem({
  quest,
  skill,
}: CompletedQuestItemProps): JSX.Element {
  return (
    <motion.div
      className="flex items-center gap-4 py-3 px-4 opacity-60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.6 }}
      layout
    >
      {/* Completed checkmark */}
      <div className="w-5 h-5 rounded bg-[var(--sl-success)] flex items-center justify-center shrink-0">
        <Check size={12} className="text-white" />
      </div>

      {/* Title - strikethrough */}
      <span className="flex-1 text-[var(--text-small)] text-[var(--sl-text-muted)] line-through truncate">
        {quest.title}
      </span>

      {/* Skill indicator */}
      {skill && (
        <span className="text-[var(--text-xs)]" style={{ color: skill.color }}>
          {skill.icon}
        </span>
      )}

      {/* XP earned */}
      <span className="text-[var(--text-xs)] text-[var(--sl-text-muted)] tabular-nums">
        +{quest.xpReward} XP
      </span>
    </motion.div>
  );
}
