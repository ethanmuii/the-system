// src/hooks/useTimer.ts
// Custom hook for timer functionality with tick interval management

import { useEffect, useCallback } from "react";
import { useTimerStore } from "@/stores/timerStore";
import { useSkillsStore } from "@/stores/skillsStore";
import { formatTime } from "@/lib/xpCalculator";

export function useTimer() {
  // Timer state
  const isRunning = useTimerStore((state) => state.isRunning);
  const isPaused = useTimerStore((state) => state.isPaused);
  const skillId = useTimerStore((state) => state.skillId);
  const elapsedSeconds = useTimerStore((state) => state.elapsedSeconds);
  const totalPauseSeconds = useTimerStore((state) => state.totalPauseSeconds);
  const pauseStartTime = useTimerStore((state) => state.pauseStartTime);
  const isRecoveryMode = useTimerStore((state) => state.isRecoveryMode);
  const recoveryPauseExceeded = useTimerStore((state) => state.recoveryPauseExceeded);

  // Timer actions
  const startTimer = useTimerStore((state) => state.startTimer);
  const pauseTimer = useTimerStore((state) => state.pauseTimer);
  const resumeTimer = useTimerStore((state) => state.resumeTimer);
  const stopTimer = useTimerStore((state) => state.stopTimer);
  const tick = useTimerStore((state) => state.tick);
  const reset = useTimerStore((state) => state.reset);
  const setRecoveryMode = useTimerStore((state) => state.setRecoveryMode);

  // Get selected skill info
  const skills = useSkillsStore((state) => state.skills);
  const selectedSkill = skills.find((s) => s.id === skillId) ?? null;

  // Manage tick interval
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, tick]);

  // Calculate current pause duration (for UI display)
  const currentPauseDuration = pauseStartTime
    ? Math.floor((Date.now() - pauseStartTime.getTime()) / 1000)
    : 0;

  // Formatted time string
  const formattedTime = formatTime(elapsedSeconds);

  // Start timer with skill
  const start = useCallback(
    (newSkillId: string) => {
      startTimer(newSkillId);
    },
    [startTimer]
  );

  // Pause the timer
  const pause = useCallback(() => {
    pauseTimer();
  }, [pauseTimer]);

  // Resume the timer
  const resume = useCallback(() => {
    resumeTimer();
  }, [resumeTimer]);

  // Stop and return results
  const stop = useCallback(() => {
    return stopTimer();
  }, [stopTimer]);

  return {
    // State
    isRunning,
    isPaused,
    skillId,
    selectedSkill,
    elapsedSeconds,
    formattedTime,
    totalPauseSeconds,
    currentPauseDuration,
    isRecoveryMode,
    recoveryPauseExceeded,

    // Actions
    start,
    pause,
    resume,
    stop,
    reset,
    setRecoveryMode,
  };
}
