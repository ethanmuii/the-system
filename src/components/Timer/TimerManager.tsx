// src/components/Timer/TimerManager.tsx
// Headless component that maintains the timer tick interval at the app root level.
// This ensures the timer continues running even when navigating away from the Timer view.
// Also handles auto-pause when system wakes from sleep/hibernation.

import { useEffect, useRef } from "react";
import { useTimerStore } from "@/stores/timerStore";

// If the time between ticks exceeds this threshold, we assume the system was asleep
const SLEEP_DETECTION_THRESHOLD_MS = 5000; // 5 seconds (expecting 1 second intervals)

export function TimerManager(): null {
  const isRunning = useTimerStore((state) => state.isRunning);
  const isPaused = useTimerStore((state) => state.isPaused);
  const tick = useTimerStore((state) => state.tick);
  const pauseTimer = useTimerStore((state) => state.pauseTimer);

  // Track the last tick time to detect sleep/hibernation
  const lastTickTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isRunning || isPaused) return;

    // Reset last tick time when timer starts or resumes
    lastTickTimeRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTickTimeRef.current;

      // Detect if system was asleep (elapsed time >> expected 1 second)
      if (elapsed > SLEEP_DETECTION_THRESHOLD_MS) {
        // System was asleep - pause the timer instead of continuing
        pauseTimer();
        return;
      }

      lastTickTimeRef.current = now;
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, tick, pauseTimer]);

  return null;
}
