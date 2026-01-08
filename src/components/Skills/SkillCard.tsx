// src/components/Skills/SkillCard.tsx
// Individual skill card with level and XP progress

import { motion } from "framer-motion";
import type { Skill } from "@/types";
import { formatXP, xpRequiredForLevel } from "@/lib/xpCalculator";

interface SkillCardProps {
  skill: Skill;
  onSelect: (skillId: string) => void;
}

export function SkillCard({ skill, onSelect }: SkillCardProps): JSX.Element {
  // Calculate XP breakdown for display
  const currentLevelXP = xpRequiredForLevel(skill.level);
  const nextLevelXP = xpRequiredForLevel(skill.level + 1);
  const xpIntoLevel = skill.totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;

  return (
    <motion.div
      className="glass-panel p-4 cursor-pointer"
      style={{
        borderLeftWidth: "3px",
        borderLeftColor: skill.color,
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: `0 0 16px ${skill.color}33`,
      }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(skill.id)}
      transition={{ duration: 0.15 }}
    >
      {/* Header: Icon + Name */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{skill.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-[var(--text-h3)] font-semibold truncate">
            {skill.name}
          </h3>
        </div>
      </div>

      {/* Level Display */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-[var(--text-xs)] uppercase text-[var(--sl-text-secondary)] tracking-wider">
          Level
        </span>
        <span
          className="text-[var(--text-stat)] font-bold"
          style={{ color: skill.color }}
        >
          {skill.level}
        </span>
      </div>

      {/* XP Progress Bar */}
      <div className="mb-2">
        <div className="xp-bar">
          <motion.div
            className="xp-bar-fill"
            style={{
              background: `linear-gradient(90deg, ${skill.color}, ${skill.color}cc)`,
              boxShadow: `0 0 8px ${skill.color}50`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${skill.progress}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {/* XP Text + Hours */}
      <div className="flex justify-between text-[var(--text-xs)] text-[var(--sl-text-muted)]">
        <span className="tabular-nums">
          {formatXP(xpIntoLevel)} / {formatXP(xpNeeded)} XP
        </span>
        <span className="tabular-nums">{skill.totalHours.toFixed(1)}h</span>
      </div>
    </motion.div>
  );
}
