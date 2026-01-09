// src/components/Timer/RecoveryQuestBanner.tsx
// Banner showing recovery quest progress when player is debuffed

import { AlertTriangle } from "lucide-react";
import { formatTime } from "@/lib/xpCalculator";
import { getRequiredHours, getMaxPauseSeconds } from "@/lib/recoveryService";

interface RecoveryQuestBannerProps {
  accumulatedSeconds: number;
  isTimerRunning: boolean;
  isPaused: boolean;
  currentPauseDuration: number;
}

export function RecoveryQuestBanner({
  accumulatedSeconds,
  isTimerRunning,
  isPaused,
  currentPauseDuration,
}: RecoveryQuestBannerProps): JSX.Element {
  const requiredHours = getRequiredHours();
  const requiredSeconds = requiredHours * 3600;
  const maxPauseSeconds = getMaxPauseSeconds();

  const progress = Math.min(100, (accumulatedSeconds / requiredSeconds) * 100);
  const remaining = requiredSeconds - accumulatedSeconds;
  const pauseExceeded = currentPauseDuration > maxPauseSeconds;

  return (
    <div className="glass-panel p-4 border-l-4 border-[var(--sl-warning)] mb-6">
      <div className="flex items-center gap-3 mb-2">
        <AlertTriangle size={20} className="text-[var(--sl-warning)]" />
        <h3 className="text-[var(--text-h3)] font-semibold text-[var(--sl-warning)]">
          Recovery Quest Active
        </h3>
      </div>

      <p className="text-[var(--sl-text-secondary)] text-[var(--text-small)] mb-3">
        You are in a <span className="text-[var(--sl-danger)]">Weakened</span> state.
        Log {requiredHours} consecutive hours to recover. Pauses over 5 minutes will reset progress.
      </p>

      {/* Pause warning */}
      {isPaused && pauseExceeded && (
        <div className="flex items-center gap-2 text-[var(--sl-danger)] text-[var(--text-small)] mb-3 p-2 rounded bg-[rgba(239,68,68,0.1)]">
          <AlertTriangle size={14} />
          <span>
            Warning: Pause exceeded 5 minutes! Progress will be lost when you resume.
          </span>
        </div>
      )}

      {/* Pause time indicator */}
      {isPaused && !pauseExceeded && (
        <div className="text-[var(--text-xs)] text-[var(--sl-text-muted)] mb-3">
          Paused for {formatTime(currentPauseDuration)} (max: {formatTime(maxPauseSeconds)})
        </div>
      )}

      {/* Progress bar */}
      <div className="xp-bar mb-2">
        <div
          className="xp-bar-fill"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, var(--sl-warning), var(--sl-warning-glow))",
          }}
        />
      </div>

      <div className="flex justify-between text-[var(--text-xs)] text-[var(--sl-text-muted)]">
        <span>{formatTime(accumulatedSeconds)} / {formatTime(requiredSeconds)}</span>
        <span>{formatTime(remaining)} remaining</span>
      </div>

      {/* Instructions based on state */}
      <div className="mt-3 text-[var(--text-xs)] text-[var(--sl-text-muted)]">
        {!isTimerRunning && accumulatedSeconds === 0 && (
          <span>Start the timer to begin your recovery quest</span>
        )}
        {!isTimerRunning && accumulatedSeconds > 0 && (
          <span>Continue tracking to reach your recovery goal</span>
        )}
        {isTimerRunning && !isPaused && (
          <span className="text-[var(--sl-success)]">Recovery in progress...</span>
        )}
      </div>
    </div>
  );
}
