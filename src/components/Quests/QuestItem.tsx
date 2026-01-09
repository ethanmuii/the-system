// src/components/Quests/QuestItem.tsx
// Individual quest row component with checkbox, title, difficulty badge, and skill pill

import { motion } from "framer-motion";
import { Check, Pencil, Trash2 } from "lucide-react";
import type { Quest, Skill } from "@/types";

interface QuestItemProps {
  quest: Quest;
  skill: Skill | undefined;
  onComplete: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function QuestItem({
  quest,
  skill,
  onComplete,
  onEdit,
  onDelete,
}: QuestItemProps): JSX.Element {
  const difficultyBadgeClass = {
    easy: "badge-easy",
    medium: "badge-medium",
    hard: "badge-hard",
  }[quest.difficulty];

  const handleCheckboxClick = (): void => {
    if (!quest.isCompleted) {
      onComplete(quest.id);
    }
  };

  return (
    <motion.div
      className={`glass-panel p-3 flex items-center gap-3 ${
        quest.isCompleted ? "opacity-60" : ""
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: quest.isCompleted ? 0.6 : 1, y: 0 }}
      whileHover={!quest.isCompleted ? { scale: 1.01 } : undefined}
      transition={{ duration: 0.15 }}
      layout
    >
      {/* Checkbox */}
      <button
        onClick={handleCheckboxClick}
        disabled={quest.isCompleted}
        className={`
          w-6 h-6 rounded border-2 flex items-center justify-center
          transition-all duration-200
          ${
            quest.isCompleted
              ? "bg-[var(--sl-success)] border-[var(--sl-success)]"
              : "border-[var(--sl-border-medium)] hover:border-[var(--sl-blue-glow)] hover:bg-[var(--sl-blue-glow)]/10"
          }
        `}
      >
        {quest.isCompleted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
          >
            <Check size={14} className="text-white" />
          </motion.div>
        )}
      </button>

      {/* Title */}
      <span
        className={`
          flex-1 text-[var(--text-body)] font-medium truncate
          ${quest.isCompleted ? "line-through text-[var(--sl-text-muted)]" : "text-[var(--sl-text-primary)]"}
        `}
      >
        {quest.title}
      </span>

      {/* Difficulty Badge */}
      <span
        className={`${difficultyBadgeClass} text-[var(--text-xs)] font-semibold uppercase px-2 py-0.5 rounded`}
      >
        {quest.difficulty}
      </span>

      {/* XP Reward */}
      <span className="text-[var(--text-xs)] text-[var(--sl-text-secondary)] tabular-nums min-w-[50px] text-right">
        +{quest.xpReward} XP
      </span>

      {/* Skill Pill */}
      {skill && (
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[var(--text-xs)]"
          style={{
            backgroundColor: `${skill.color}20`,
            border: `1px solid ${skill.color}40`,
          }}
        >
          <span>{skill.icon}</span>
          <span style={{ color: skill.color }} className="font-medium">
            {skill.name.length > 12
              ? skill.name.substring(0, 12) + "..."
              : skill.name}
          </span>
        </div>
      )}

      {/* Action Buttons - Only show for incomplete quests */}
      {!quest.isCompleted && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(quest.id)}
            className="p-1.5 rounded hover:bg-[var(--sl-bg-elevated)] transition-colors"
            title="Edit quest"
          >
            <Pencil size={14} className="text-[var(--sl-text-muted)]" />
          </button>
          <button
            onClick={() => onDelete(quest.id)}
            className="p-1.5 rounded hover:bg-[var(--sl-danger)]/20 transition-colors"
            title="Delete quest"
          >
            <Trash2 size={14} className="text-[var(--sl-text-muted)] hover:text-[var(--sl-danger)]" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
