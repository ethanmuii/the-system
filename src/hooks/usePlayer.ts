// src/hooks/usePlayer.ts
// Custom hook wrapping playerStore with computed values

import { usePlayerStore } from "@/stores/playerStore";
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
  addXP: (amount: number) => Promise<void>;
  setDebuffed: (isDebuffed: boolean) => Promise<void>;

  // Computed values
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

  // Compute derived values
  const level = store.player ? calculateLevel(store.player.overallXP) : 0;
  const progress = store.player ? visualProgress(store.player.overallXP) : 5;
  const currentLevelXP = xpRequiredForLevel(level);
  const nextLevelXP = xpRequiredForLevel(level + 1);
  const xpToNextLevel = store.player
    ? nextLevelXP - store.player.overallXP
    : nextLevelXP;
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
    addXP: store.addXP,
    setDebuffed: store.setDebuffed,

    // Computed
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
