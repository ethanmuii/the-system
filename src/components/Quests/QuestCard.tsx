// src/components/Quests/QuestCard.tsx
// Card-style quest display for active (incomplete) quests

import { motion } from "framer-motion";
import { Check, Pencil, Trash2, Loader2 } from "lucide-react";
import type { Quest, Skill } from "@/types";

interface QuestCardProps {
  quest: Quest;
  skill: Skill | undefined;
  isCompleting?: boolean;
  onComplete: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function QuestCard({
  quest,
  skill,
  isCompleting = false,
  onComplete,
  onEdit,
  onDelete,
}: QuestCardProps): JSX.Element {
  const difficultyColor = {
    easy: "var(--sl-success)",
    medium: "var(--sl-warning)",
    hard: "var(--sl-danger)",
  }[quest.difficulty];

  return (
    <motion.div
      className="glass-panel p-6 lg:p-8 cursor-pointer"
      style={{
        borderLeftWidth: "3px",
        borderLeftColor: skill?.color ?? "var(--sl-blue-glow)",
      }}
      whileHover={{ scale: 1.01 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      layout
    >
      {/* Header: Title + Actions */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-[var(--text-h3)] lg:text-[var(--text-h2)] font-semibold text-[var(--sl-text-primary)] pr-3 leading-snug">
          {quest.title}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onEdit(quest.id)}
            className="p-2 rounded hover:bg-[var(--sl-bg-elevated)] transition-colors"
            title="Edit quest"
          >
            <Pencil size={14} className="text-[var(--sl-text-muted)]" />
          </button>
          <button
            onClick={() => onDelete(quest.id)}
            className="p-2 rounded hover:bg-[var(--sl-danger)]/20 transition-colors"
            title="Delete quest"
          >
            <Trash2 size={14} className="text-[var(--sl-text-muted)] hover:text-[var(--sl-danger)]" />
          </button>
        </div>
      </div>

      {/* Metadata Row: Difficulty + XP + Skill */}
      <div className="flex items-center flex-wrap gap-2.5 mb-5">
        <span
          className="text-[var(--text-xs)] font-semibold uppercase px-2.5 py-1 rounded"
          style={{
            backgroundColor: `color-mix(in srgb, ${difficultyColor} 20%, transparent)`,
            color: difficultyColor,
            border: `1px solid color-mix(in srgb, ${difficultyColor} 30%, transparent)`,
          }}
        >
          {quest.difficulty}
        </span>
        <span className="text-[var(--text-small)] text-[var(--sl-blue-ice)] font-medium">
          +{quest.xpReward} XP
        </span>
        {skill && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[var(--text-xs)]"
            style={{
              backgroundColor: `${skill.color}20`,
              border: `1px solid ${skill.color}40`,
            }}
          >
            <span>{skill.icon}</span>
            <span style={{ color: skill.color }} className="font-medium">
              {skill.name}
            </span>
          </div>
        )}
      </div>

      {/* Complete Button */}
      <button
        onClick={() => onComplete(quest.id)}
        disabled={isCompleting}
        className={`w-full btn-primary flex items-center justify-center gap-2 ${
          isCompleting ? "opacity-70 cursor-not-allowed" : ""
        }`}
      >
        {isCompleting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Completing...
          </>
        ) : (
          <>
            <Check size={16} />
            Complete Quest
          </>
        )}
      </button>
    </motion.div>
  );
}
