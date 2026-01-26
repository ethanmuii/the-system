// src/components/Timer/TimerControls.tsx
// Timer control buttons: Start, Pause, Resume, Stop, Cancel

import { Play, Pause, Square, X } from "lucide-react";

interface TimerControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  canStart: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onCancel: () => void;
}

export function TimerControls({
  isRunning,
  isPaused,
  canStart,
  onStart,
  onPause,
  onResume,
  onStop,
  onCancel,
}: TimerControlsProps): JSX.Element {
  if (!isRunning) {
    // Not running - show Start button
    return (
      <div className="flex justify-center gap-4">
        <button
          onClick={onStart}
          disabled={!canStart}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play size={18} />
          Start
        </button>
      </div>
    );
  }

  // Running - show Cancel, Pause/Resume, and Stop buttons
  return (
    <div className="flex justify-center gap-3">
      {/* Cancel button - destructive, less prominent */}
      <button
        onClick={onCancel}
        className="btn-ghost flex items-center gap-2 text-[var(--sl-text-muted)] hover:text-red-400 hover:border-red-400/50"
      >
        <X size={18} />
        Cancel
      </button>

      {isPaused ? (
        <button onClick={onResume} className="btn-primary flex items-center gap-2">
          <Play size={18} />
          Resume
        </button>
      ) : (
        <button onClick={onPause} className="btn-ghost flex items-center gap-2">
          <Pause size={18} />
          Pause
        </button>
      )}

      <button
        onClick={onStop}
        className="btn-primary flex items-center gap-2"
        style={{
          background: "linear-gradient(180deg, rgba(16, 185, 129, 0.8) 0%, rgba(6, 95, 70, 0.9) 100%)",
          borderColor: "var(--sl-success)",
        }}
      >
        <Square size={18} />
        Stop & Save
      </button>
    </div>
  );
}
