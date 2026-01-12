// src/components/Timer/TimerManager.tsx
// Headless component that maintains the timer tick interval at the app root level.
// This ensures the timer continues running even when navigating away from the Timer view.

import { useEffect } from "react";
import { useTimerStore } from "@/stores/timerStore";

export function TimerManager(): null {
  const isRunning = useTimerStore((state) => state.isRunning);
  const isPaused = useTimerStore((state) => state.isPaused);
  const tick = useTimerStore((state) => state.tick);

  useEffect(() => {
    if (!isRunning || isPaused) return;

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, tick]);

  return null;
}
