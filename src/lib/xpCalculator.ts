// src/lib/xpCalculator.ts
// Core XP and leveling calculations for ARISE

import type { Difficulty, Quest } from "@/types";

// === CONSTANTS ===

export const TIME_XP_RATE = 100; // XP per hour logged

export const QUEST_XP = {
  easy: 50,
  medium: 150,
  hard: 300,
} as const;

export const HEALTH_CONFIG = {
  max: 100,
  starting: 100,
  perQuestPenalty: -5,    // Penalty per missed quest
  maxDailyPenalty: -20,   // Cap on daily penalty (protects against despair spiral)
  dailyReward: 5,         // Reward for completing ALL quests (perfection bonus)
  debuffThreshold: 0,
  recoveryHealth: 50,
} as const;

export const RECOVERY_QUEST = {
  requiredHours: 8,
  maxPauseMinutes: 5,
  healthRestored: 50,
} as const;

export const DEBUFF_MULTIPLIER = 0.5;

// === LEVEL CALCULATIONS ===

/**
 * XP required to reach a given level
 * Uses quadratic curve: 50 * level^2
 */
export function xpRequiredForLevel(level: number): number {
  return 50 * level * level;
}

/**
 * Calculate current level based on total XP
 */
export function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 50));
}

/**
 * Calculate progress to next level (0-100%)
 */
export function levelProgress(totalXP: number): number {
  const currentLevel = calculateLevel(totalXP);
  const currentLevelXP = xpRequiredForLevel(currentLevel);
  const nextLevelXP = xpRequiredForLevel(currentLevel + 1);

  if (nextLevelXP === currentLevelXP) return 0;

  return ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
}

/**
 * Visual progress with endowed progress effect (minimum 5%)
 */
export function visualProgress(totalXP: number): number {
  const actual = levelProgress(totalXP);
  return Math.max(5, actual);
}

// === STREAK MULTIPLIERS ===

/**
 * Get XP multiplier based on streak days
 */
export function getStreakMultiplier(streakDays: number): number {
  if (streakDays >= 30) return 2.0;
  if (streakDays >= 14) return 1.5;
  if (streakDays >= 7) return 1.25;
  return 1.0;
}

// === XP CALCULATIONS ===

/**
 * Calculate XP earned from time logged
 */
export function calculateTimeXP(hours: number): number {
  return Math.floor(hours * TIME_XP_RATE);
}

/**
 * Calculate XP from a quest based on difficulty
 */
export function calculateQuestXP(difficulty: Difficulty): number {
  return QUEST_XP[difficulty];
}

/**
 * Calculate total XP for a session
 */
export function calculateSessionXP(
  hoursLogged: number,
  questsCompleted: Quest[],
  streakMultiplier: number,
  isDebuffed: boolean = false
): number {
  const timeXP = calculateTimeXP(hoursLogged);
  const questXP = questsCompleted.reduce(
    (sum, q) => sum + QUEST_XP[q.difficulty],
    0
  );
  let total = Math.floor((timeXP + questXP) * streakMultiplier);

  if (isDebuffed) {
    total = Math.floor(total * DEBUFF_MULTIPLIER);
  }

  return total;
}

// === HEALTH CALCULATIONS ===

/**
 * Calculate health change based on quest completion counts
 *
 * Behavior:
 * - No quests for the day: 0 (no change)
 * - All quests completed: +5 (perfection bonus)
 * - Missed quests: -5 per missed quest, capped at -20
 *
 * This per-quest penalty system incentivizes completing as many quests
 * as possible, even on "bad days" where perfection isn't achievable.
 */
export function calculateDailyHealthChange(
  questsCompleted: number,
  questsTotal: number
): number {
  // No quests = no change (rest day or not set up yet)
  if (questsTotal === 0) {
    return 0;
  }

  // Perfect completion: award the daily reward
  if (questsCompleted === questsTotal) {
    return HEALTH_CONFIG.dailyReward;
  }

  // Partial completion: penalty per missed quest, with cap
  const missedQuests = questsTotal - questsCompleted;
  const rawPenalty = missedQuests * HEALTH_CONFIG.perQuestPenalty;

  // Cap the penalty to prevent catastrophic loss
  return Math.max(rawPenalty, HEALTH_CONFIG.maxDailyPenalty);
}

/**
 * Apply health change to current health, clamping to valid range
 */
export function applyHealthChange(
  currentHealth: number,
  healthChange: number
): number {
  const newHealth = currentHealth + healthChange;
  return Math.max(0, Math.min(HEALTH_CONFIG.max, newHealth));
}

/**
 * Check if player should enter debuffed state
 */
export function shouldEnterDebuff(health: number): boolean {
  return health <= HEALTH_CONFIG.debuffThreshold;
}

// === UTILITY FUNCTIONS ===

/**
 * Convert seconds to hours (for XP calculations)
 */
export function secondsToHours(seconds: number): number {
  return seconds / 3600;
}

/**
 * Format seconds as HH:MM:SS
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [hours, minutes, secs]
    .map((v) => v.toString().padStart(2, "0"))
    .join(":");
}

/**
 * Format XP number with commas
 */
export function formatXP(xp: number): string {
  return xp.toLocaleString();
}
