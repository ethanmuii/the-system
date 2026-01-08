// src/components/Dashboard/StreakDisplay.tsx
// Streak display with fire emoji and multiplier badge

interface StreakDisplayProps {
  days: number;
  multiplier: number;
}

export function StreakDisplay({
  days,
  multiplier,
}: StreakDisplayProps): JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xl">🔥</span>
      <span className="text-[var(--text-h3)] font-semibold">
        {days} Day{days !== 1 ? "s" : ""} Streak
      </span>
      {multiplier > 1 && (
        <span className="badge-easy text-[var(--text-xs)] font-semibold">
          {multiplier}x
        </span>
      )}
    </div>
  );
}
