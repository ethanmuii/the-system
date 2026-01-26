// src/stores/playerStore.ts
// Zustand store for player state management

import { create } from "zustand";
import { query, execute } from "@/lib/db";
import { getTodayString } from "@/lib/dateUtils";
import type { Player } from "@/types";

// Database row type (snake_case)
interface PlayerDbRow {
  id: number;
  overall_xp: number;
  current_streak: number;
  longest_streak: number;
  health: number;
  is_debuffed: number; // SQLite boolean
  recovery_start_time: string | null;
  recovery_accumulated_seconds: number;
  last_processed_date: string | null;
  created_at: string;
  updated_at: string;
}

// Time log row for today's XP and hours calculation
interface TimeLogRow {
  xp_earned: number;
  duration_seconds: number;
}

/**
 * Map database row to Player type
 */
function mapDbRowToPlayer(row: PlayerDbRow): Player {
  return {
    id: 1,
    overallXP: row.overall_xp,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    health: row.health,
    isDebuffed: row.is_debuffed === 1,
    recoveryStartTime: row.recovery_start_time
      ? new Date(row.recovery_start_time)
      : null,
    recoveryAccumulatedSeconds: row.recovery_accumulated_seconds || 0,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

interface PlayerStore {
  // State
  player: Player | null;
  loading: boolean;
  error: string | null;
  todayXP: number;
  todayHours: number;

  // Actions
  fetchPlayer: () => Promise<void>;
  updateHealth: (newHealth: number) => Promise<void>;
  updateStreak: (newStreak: number) => Promise<void>;
  addXP: (amount: number) => Promise<void>;
  setDebuffed: (isDebuffed: boolean) => Promise<void>;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  player: null,
  loading: true,
  error: null,
  todayXP: 0,
  todayHours: 0,

  fetchPlayer: async () => {
    set({ loading: true, error: null });
    try {
      // Fetch player data
      const rows = await query<PlayerDbRow>(
        "SELECT * FROM player WHERE id = 1"
      );

      if (rows.length === 0) {
        throw new Error("Player not found");
      }

      const player = mapDbRowToPlayer(rows[0]);

      // Calculate today's XP and hours from time_logs
      const today = getTodayString();
      const logs = await query<TimeLogRow>(
        "SELECT xp_earned, duration_seconds FROM time_logs WHERE DATE(logged_at) = ?",
        [today]
      );
      const todayXP = logs.reduce((sum, log) => sum + log.xp_earned, 0);
      const todaySeconds = logs.reduce((sum, log) => sum + log.duration_seconds, 0);
      const todayHours = todaySeconds / 3600;

      set({ player, todayXP, todayHours, loading: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch player";
      set({ error: errorMessage, loading: false });
      console.error("Failed to fetch player:", err);
    }
  },

  updateHealth: async (newHealth: number) => {
    const { player } = get();
    if (!player) return;

    const clampedHealth = Math.max(0, Math.min(100, newHealth));

    try {
      await execute(
        "UPDATE player SET health = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
        [clampedHealth]
      );

      set({
        player: { ...player, health: clampedHealth },
      });
    } catch (err) {
      console.error("Failed to update health:", err);
    }
  },

  updateStreak: async (newStreak: number) => {
    const { player } = get();
    if (!player) return;

    const longestStreak = Math.max(player.longestStreak, newStreak);

    try {
      await execute(
        "UPDATE player SET current_streak = ?, longest_streak = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
        [newStreak, longestStreak]
      );

      set({
        player: { ...player, currentStreak: newStreak, longestStreak },
      });
    } catch (err) {
      console.error("Failed to update streak:", err);
    }
  },

  addXP: async (amount: number) => {
    const { player, todayXP } = get();
    if (!player) return;

    const newOverallXP = player.overallXP + amount;

    try {
      await execute(
        "UPDATE player SET overall_xp = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
        [newOverallXP]
      );

      set({
        player: { ...player, overallXP: newOverallXP },
        todayXP: todayXP + amount,
      });
    } catch (err) {
      console.error("Failed to add XP:", err);
    }
  },

  setDebuffed: async (isDebuffed: boolean) => {
    const { player } = get();
    if (!player) return;

    try {
      await execute(
        "UPDATE player SET is_debuffed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
        [isDebuffed ? 1 : 0]
      );

      set({
        player: { ...player, isDebuffed },
      });
    } catch (err) {
      console.error("Failed to set debuffed state:", err);
    }
  },
}));
