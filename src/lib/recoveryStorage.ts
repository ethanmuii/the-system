// src/lib/recoveryStorage.ts
// LocalStorage helpers for recovery state persistence

const RECOVERY_STORAGE_KEY = "arise_recovery_state";

export interface RecoveryState {
  startTime: string | null; // ISO string
  accumulatedSeconds: number;
}

const DEFAULT_RECOVERY_STATE: RecoveryState = {
  startTime: null,
  accumulatedSeconds: 0,
};

/**
 * Get recovery state from localStorage
 */
export function getRecoveryState(): RecoveryState {
  try {
    const stored = localStorage.getItem(RECOVERY_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_RECOVERY_STATE;
    }
    return JSON.parse(stored) as RecoveryState;
  } catch {
    console.error("Failed to parse recovery state from localStorage");
    return DEFAULT_RECOVERY_STATE;
  }
}

/**
 * Save recovery state to localStorage
 */
export function setRecoveryState(state: RecoveryState): void {
  try {
    localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.error("Failed to save recovery state to localStorage");
  }
}

/**
 * Clear recovery state from localStorage
 */
export function clearRecoveryState(): void {
  try {
    localStorage.removeItem(RECOVERY_STORAGE_KEY);
  } catch {
    console.error("Failed to clear recovery state from localStorage");
  }
}

/**
 * Start recovery tracking
 */
export function startRecovery(): void {
  setRecoveryState({
    startTime: new Date().toISOString(),
    accumulatedSeconds: 0,
  });
}

/**
 * Update accumulated recovery seconds
 */
export function updateRecoverySeconds(seconds: number): void {
  const current = getRecoveryState();
  setRecoveryState({
    ...current,
    accumulatedSeconds: seconds,
  });
}

/**
 * Check if recovery is in progress
 */
export function isRecoveryInProgress(): boolean {
  const state = getRecoveryState();
  return state.startTime !== null;
}
