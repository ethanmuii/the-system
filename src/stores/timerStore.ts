// src/stores/timerStore.ts
// Zustand store for in-memory timer state management

import { create } from "zustand";
import type { TimerState } from "@/types";

interface TimerStopResult {
  skillId: string;
  elapsedSeconds: number;
  totalPauseSeconds: number;
}

interface TimerStore extends TimerState {
  // Recovery mode state
  isRecoveryMode: boolean;
  recoveryPauseExceeded: boolean;

  // Actions
  startTimer: (skillId: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => TimerStopResult | null;
  tick: () => void;
  reset: () => void;
  setRecoveryMode: (isRecovery: boolean) => void;
}

const INITIAL_STATE: TimerState = {
  isRunning: false,
  skillId: null,
  startTime: null,
  elapsedSeconds: 0,
  isPaused: false,
  pauseStartTime: null,
  totalPauseSeconds: 0,
};

const MAX_PAUSE_SECONDS = 5 * 60; // 5 minutes for recovery quest

export const useTimerStore = create<TimerStore>((set, get) => ({
  ...INITIAL_STATE,
  isRecoveryMode: false,
  recoveryPauseExceeded: false,

  startTimer: (skillId: string) => {
    set({
      isRunning: true,
      skillId,
      startTime: new Date(),
      elapsedSeconds: 0,
      isPaused: false,
      pauseStartTime: null,
      totalPauseSeconds: 0,
      recoveryPauseExceeded: false,
    });
  },

  pauseTimer: () => {
    set({
      isPaused: true,
      pauseStartTime: new Date(),
    });
  },

  resumeTimer: () => {
    const { pauseStartTime, totalPauseSeconds, isRecoveryMode } = get();
    if (!pauseStartTime) return;

    const pauseDuration = Math.floor(
      (Date.now() - pauseStartTime.getTime()) / 1000
    );
    const newTotalPause = totalPauseSeconds + pauseDuration;

    // Check if pause exceeded 5 minutes during recovery
    const recoveryPauseExceeded = isRecoveryMode && pauseDuration > MAX_PAUSE_SECONDS;

    set({
      isPaused: false,
      pauseStartTime: null,
      totalPauseSeconds: newTotalPause,
      recoveryPauseExceeded,
    });
  },

  stopTimer: () => {
    const { skillId, elapsedSeconds, totalPauseSeconds } = get();
    if (!skillId) return null;

    const result: TimerStopResult = {
      skillId,
      elapsedSeconds,
      totalPauseSeconds,
    };

    // Reset state
    set({
      ...INITIAL_STATE,
      isRecoveryMode: false,
      recoveryPauseExceeded: false,
    });

    return result;
  },

  tick: () => {
    const { isRunning, isPaused, elapsedSeconds } = get();
    if (!isRunning || isPaused) return;

    set({ elapsedSeconds: elapsedSeconds + 1 });
  },

  reset: () => {
    set({
      ...INITIAL_STATE,
      isRecoveryMode: false,
      recoveryPauseExceeded: false,
    });
  },

  setRecoveryMode: (isRecovery: boolean) => {
    set({ isRecoveryMode: isRecovery });
  },
}));
