// src/components/Dashboard/PlayerStats.tsx
// Player stats panel showing overall level, health, streak, and today's XP

import { motion } from "framer-motion";
import { usePlayer } from "@/hooks/usePlayer";
import { formatXP } from "@/lib/xpCalculator";
import { HealthBar } from "./HealthBar";
import { StreakDisplay } from "./StreakDisplay";

export function PlayerStats(): JSX.Element {
  const {
    player,
    loading,
    level,
    progress,
    currentLevelXP,
    nextLevelXP,
    streakMultiplier,
    todayXP,
  } = usePlayer();

  if (loading) {
    return (
      <div className="glass-panel p-6 animate-pulse">
        <div className="h-8 bg-[var(--sl-bg-elevated)] rounded w-1/3 mb-4" />
        <div className="h-4 bg-[var(--sl-bg-elevated)] rounded w-full mb-4" />
        <div className="h-4 bg-[var(--sl-bg-elevated)] rounded w-2/3" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="glass-panel p-6">
        <p className="text-[var(--sl-danger)]">Failed to load player data</p>
      </div>
    );
  }

  const xpIntoLevel = player.overallXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;

  return (
    <div className="glass-panel p-6">
      {/* Row 1: Level + Health */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="text-[var(--text-small)] uppercase tracking-wider text-[var(--sl-text-secondary)] block mb-1">
            Overall Level
          </span>
          <span className="text-[var(--text-display)] font-bold level-display">
            {level}
          </span>
        </div>
        <HealthBar current={player.health} max={100} />
      </div>

      {/* XP Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-[var(--text-small)] mb-2">
          <span className="text-[var(--sl-text-secondary)]">XP Progress</span>
          <span className="text-[var(--sl-text-muted)] tabular-nums">
            {formatXP(xpIntoLevel)} / {formatXP(xpNeeded)} XP
          </span>
        </div>
        <div className="xp-bar">
          <motion.div
            className="xp-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {/* Row 2: Streak + Today's XP */}
      <div className="flex justify-between items-center">
        <StreakDisplay days={player.currentStreak} multiplier={streakMultiplier} />
        <div className="text-right">
          <span className="text-[var(--text-small)] text-[var(--sl-text-secondary)] block">
            Today
          </span>
          <span className="text-[var(--text-h3)] font-semibold text-[var(--sl-blue-ice)]">
            +{formatXP(todayXP)} XP
          </span>
        </div>
      </div>

      {/* Debuff Banner */}
      {player.isDebuffed && (
        <motion.div
          className="mt-4 p-3 rounded-lg bg-[var(--sl-danger)]/20 border border-[var(--sl-danger)]/30"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-[var(--sl-danger)] font-semibold uppercase text-[var(--text-small)] flex items-center gap-2">
            <span>⚠️</span>
            <span>Weakened - XP gains reduced by 50%</span>
          </span>
        </motion.div>
      )}
    </div>
  );
}
