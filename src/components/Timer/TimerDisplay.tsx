// src/components/Timer/TimerDisplay.tsx
// Large monospace timer display with glow effects

interface TimerDisplayProps {
  formattedTime: string;
  isRunning: boolean;
  isPaused: boolean;
  skillColor?: string;
}

export function TimerDisplay({
  formattedTime,
  isRunning,
  isPaused,
  skillColor,
}: TimerDisplayProps): JSX.Element {
  const isActive = isRunning && !isPaused;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`timer-display tabular-nums ${isActive ? "running" : ""}`}
        style={
          isActive && skillColor
            ? {
                color: skillColor,
                textShadow: `0 0 8px ${skillColor}, 0 0 16px ${skillColor}50`,
              }
            : undefined
        }
      >
        {formattedTime}
      </div>

      {/* Status indicator */}
      <div className="text-[var(--text-small)] text-[var(--sl-text-muted)]">
        {!isRunning && "Ready"}
        {isRunning && !isPaused && "Running"}
        {isRunning && isPaused && (
          <span className="text-[var(--sl-warning)]">Paused</span>
        )}
      </div>
    </div>
  );
}
