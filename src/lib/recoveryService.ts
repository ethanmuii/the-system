// src/lib/recoveryService.ts
// Recovery quest completion logic

import { RECOVERY_QUEST } from "@/lib/xpCalculator";
import {
  getRecoveryState,
  setRecoveryState,
  clearRecoveryState,
} from "@/lib/recoveryStorage";

const REQUIRED_SECONDS = RECOVERY_QUEST.requiredHours * 3600; // 8 hours = 28800 seconds
const MAX_PAUSE_SECONDS = RECOVERY_QUEST.maxPauseMinutes * 60; // 5 minutes = 300 seconds

export interface RecoveryProgress {
  accumulatedSeconds: number;
  isComplete: boolean;
  progress: number; // 0-100
  remainingSeconds: number;
  isActive: boolean;
}

/**
 * Get current recovery progress
 */
export function getRecoveryProgress(): RecoveryProgress {
  const state = getRecoveryState();
  const isActive = state.startTime !== null;
  const accumulatedSeconds = state.accumulatedSeconds;

  return {
    accumulatedSeconds,
    isComplete: accumulatedSeconds >= REQUIRED_SECONDS,
    progress: Math.min(100, (accumulatedSeconds / REQUIRED_SECONDS) * 100),
    remainingSeconds: Math.max(0, REQUIRED_SECONDS - accumulatedSeconds),
    isActive,
  };
}

/**
 * Start recovery tracking
 */
export function startRecoveryTracking(): void {
  setRecoveryState({
    startTime: new Date().toISOString(),
    accumulatedSeconds: 0,
  });
}

/**
 * Update recovery progress with new session time
 * @param sessionSeconds - Seconds from the completed timer session
 * @param pauseExceeded - Whether the pause exceeded 5 minutes
 * @returns Updated recovery progress
 */
export function updateRecoveryProgress(
  sessionSeconds: number,
  pauseExceeded: boolean
): RecoveryProgress {
  if (pauseExceeded) {
    // Reset progress if pause exceeded 5 minutes
    clearRecoveryState();
    return {
      accumulatedSeconds: 0,
      isComplete: false,
      progress: 0,
      remainingSeconds: REQUIRED_SECONDS,
      isActive: false,
    };
  }

  const state = getRecoveryState();
  const newAccumulated = state.accumulatedSeconds + sessionSeconds;
  const isComplete = newAccumulated >= REQUIRED_SECONDS;

  if (isComplete) {
    // Clear recovery state on completion
    clearRecoveryState();
  } else {
    // Update accumulated seconds
    setRecoveryState({
      ...state,
      accumulatedSeconds: newAccumulated,
    });
  }

  return {
    accumulatedSeconds: isComplete ? REQUIRED_SECONDS : newAccumulated,
    isComplete,
    progress: Math.min(100, (newAccumulated / REQUIRED_SECONDS) * 100),
    remainingSeconds: Math.max(0, REQUIRED_SECONDS - newAccumulated),
    isActive: !isComplete,
  };
}

/**
 * Reset recovery tracking (called when user cancels or fails)
 */
export function resetRecoveryTracking(): void {
  clearRecoveryState();
}

/**
 * Check if a pause duration exceeds the allowed maximum
 */
export function isPauseExceeded(pauseSeconds: number): boolean {
  return pauseSeconds > MAX_PAUSE_SECONDS;
}

/**
 * Get the maximum allowed pause in seconds
 */
export function getMaxPauseSeconds(): number {
  return MAX_PAUSE_SECONDS;
}

/**
 * Get required recovery hours
 */
export function getRequiredHours(): number {
  return RECOVERY_QUEST.requiredHours;
}
