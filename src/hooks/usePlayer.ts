// src/hooks/usePlayer.ts
// Custom hook wrapping playerStore with computed values

import { usePlayerStore } from "@/stores/playerStore";
import { useSkillsStore } from "@/stores/skillsStore";
import {
  calculateLevel,
  visualProgress,
  xpRequiredForLevel,
  getStreakMultiplier,
} from "@/lib/xpCalculator";
import type { Player } from "@/types";

interface UsePlayerReturn {
  // State from store
  player: Player | null;
  loading: boolean;
  error: string | null;
  todayXP: number;

  // Actions from store
  fetchPlayer: () => Promise<void>;
  updateHealth: (newHealth: number) => Promise<void>;
  updateStreak: (newStreak: number) => Promise<void>;
  setDebuffed: (isDebuffed: boolean) => Promise<void>;

  // Computed values
  overallXP: number;
  level: number;
  progress: number;
  xpToNextLevel: number;
  currentLevelXP: number;
  nextLevelXP: number;
  streakMultiplier: number;
  isHealthCritical: boolean;
  isHealthLow: boolean;
}

export function usePlayer(): UsePlayerReturn {
  const store = usePlayerStore();
  const skillsStore = useSkillsStore();

  // Calculate overall XP from sum of all skills (not from player.overallXP)
  const overallXP = skillsStore.skills.reduce((sum, s) => sum + s.totalXP, 0);

  // Display level starting at 1 (add 1 to calculated level)
  const calculatedLevel = calculateLevel(overallXP);
  const level = calculatedLevel + 1;

  // Progress uses the raw calculated level for accurate progress bar
  const progress = visualProgress(overallXP);

  // XP thresholds based on calculated level (not display level)
  const currentLevelXP = xpRequiredForLevel(calculatedLevel);
  const nextLevelXP = xpRequiredForLevel(calculatedLevel + 1);
  const xpToNextLevel = nextLevelXP - overallXP;

  const streakMultiplier = store.player
    ? getStreakMultiplier(store.player.currentStreak)
    : 1.0;

  return {
    // State
    player: store.player,
    loading: store.loading,
    error: store.error,
    todayXP: store.todayXP,

    // Actions
    fetchPlayer: store.fetchPlayer,
    updateHealth: store.updateHealth,
    updateStreak: store.updateStreak,
    setDebuffed: store.setDebuffed,

    // Computed
    overallXP,
    level,
    progress,
    xpToNextLevel,
    currentLevelXP,
    nextLevelXP,
    streakMultiplier,
    isHealthCritical: (store.player?.health ?? 100) <= 20,
    isHealthLow: (store.player?.health ?? 100) <= 50,
  };
}
