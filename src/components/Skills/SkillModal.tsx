// src/components/Skills/SkillModal.tsx
// Detailed skill stats modal

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { Skill } from "@/types";
import { formatXP, xpRequiredForLevel } from "@/lib/xpCalculator";

interface SkillModalProps {
  skill: Skill | null;
  onClose: () => void;
}

export function SkillModal({ skill, onClose }: SkillModalProps): JSX.Element {
  if (!skill) return <></>;

  const currentLevelXP = xpRequiredForLevel(skill.level);
  const nextLevelXP = xpRequiredForLevel(skill.level + 1);
  const xpIntoLevel = skill.totalXP - currentLevelXP;
  const xpToNext = nextLevelXP - skill.totalXP;

  return (
    <AnimatePresence>
      {skill && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass-panel-elevated p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{skill.icon}</span>
                <div>
                  <h2 className="text-[var(--text-h2)] font-bold">
                    {skill.name}
                  </h2>
                  <p className="text-[var(--sl-text-secondary)] text-[var(--text-small)]">
                    {skill.totalHours.toFixed(1)} hours logged
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--sl-bg-elevated)] transition-colors"
              >
                <X size={20} className="text-[var(--sl-text-muted)]" />
              </button>
            </div>

            {/* Level Display */}
            <div className="text-center mb-6">
              <span className="text-[var(--text-xs)] uppercase tracking-wider text-[var(--sl-text-secondary)] block mb-1">
                Level
              </span>
              <span
                className="text-[4rem] font-bold leading-none"
                style={{ color: skill.color }}
              >
                {skill.level}
              </span>
            </div>

            {/* XP Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-[var(--text-small)] mb-2">
                <span className="text-[var(--sl-text-secondary)]">
                  Level Progress
                </span>
                <span className="text-[var(--sl-text-muted)]">
                  {skill.progress.toFixed(1)}%
                </span>
              </div>
              <div className="xp-bar h-3">
                <motion.div
                  className="h-full rounded"
                  style={{
                    background: `linear-gradient(90deg, ${skill.color}, ${skill.color}cc)`,
                    boxShadow: `0 0 12px ${skill.color}50`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.progress}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--sl-bg-dark)]/50 rounded-lg p-4">
                <span className="text-[var(--text-xs)] uppercase tracking-wider text-[var(--sl-text-secondary)] block mb-1">
                  Total XP
                </span>
                <span
                  className="text-[var(--text-h2)] font-bold"
                  style={{ color: skill.color }}
                >
                  {formatXP(skill.totalXP)}
                </span>
              </div>
              <div className="bg-[var(--sl-bg-dark)]/50 rounded-lg p-4">
                <span className="text-[var(--text-xs)] uppercase tracking-wider text-[var(--sl-text-secondary)] block mb-1">
                  XP to Next
                </span>
                <span className="text-[var(--text-h2)] font-bold text-[var(--sl-text-primary)]">
                  {formatXP(xpToNext)}
                </span>
              </div>
              <div className="bg-[var(--sl-bg-dark)]/50 rounded-lg p-4">
                <span className="text-[var(--text-xs)] uppercase tracking-wider text-[var(--sl-text-secondary)] block mb-1">
                  Current Level XP
                </span>
                <span className="text-[var(--text-h2)] font-bold text-[var(--sl-text-primary)]">
                  {formatXP(xpIntoLevel)}
                </span>
              </div>
              <div className="bg-[var(--sl-bg-dark)]/50 rounded-lg p-4">
                <span className="text-[var(--text-xs)] uppercase tracking-wider text-[var(--sl-text-secondary)] block mb-1">
                  Total Hours
                </span>
                <span className="text-[var(--text-h2)] font-bold text-[var(--sl-text-primary)]">
                  {skill.totalHours.toFixed(1)}h
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
