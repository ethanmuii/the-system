// src/components/Timer/ManualTimeEntry.tsx
// Manual time entry form with hours/minutes inputs

import { useState, useCallback } from "react";
import { Clock } from "lucide-react";

interface ManualTimeEntryProps {
  selectedSkillId: string | null;
  onLogTime: (hours: number, minutes: number) => Promise<void>;
  disabled?: boolean;
}

export function ManualTimeEntry({
  selectedSkillId,
  onLogTime,
  disabled = false,
}: ManualTimeEntryProps): JSX.Element {
  const [hours, setHours] = useState<string>("");
  const [minutes, setMinutes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleHoursChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Allow empty or valid numbers 0-23
      if (value === "" || (/^\d+$/.test(value) && parseInt(value) <= 23)) {
        setHours(value);
      }
    },
    []
  );

  const handleMinutesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Allow empty or valid numbers 0-59
      if (value === "" || (/^\d+$/.test(value) && parseInt(value) <= 59)) {
        setMinutes(value);
      }
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;

    if (!selectedSkillId || (h === 0 && m === 0)) return;

    setIsSubmitting(true);
    try {
      await onLogTime(h, m);
      // Reset inputs on success
      setHours("");
      setMinutes("");
    } finally {
      setIsSubmitting(false);
    }
  }, [hours, minutes, selectedSkillId, onLogTime]);

  const h = parseInt(hours) || 0;
  const m = parseInt(minutes) || 0;
  const hasTime = h > 0 || m > 0;
  const isValid = selectedSkillId && hasTime;

  return (
    <div className="glass-panel p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={16} className="text-[var(--sl-text-muted)]" />
        <p className="text-[var(--sl-text-secondary)] text-[var(--text-small)]">
          Or log time manually:
        </p>
      </div>

      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <label className="block text-[var(--text-xs)] uppercase tracking-wider text-[var(--sl-text-muted)] mb-2">
            Hours
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            min="0"
            max="23"
            value={hours}
            onChange={handleHoursChange}
            disabled={disabled || isSubmitting}
            placeholder="0"
            className="glass-panel w-20 p-3 text-center text-[var(--text-body)] bg-transparent focus:outline-none focus:border-[var(--sl-border-bright)] disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-[var(--text-xs)] uppercase tracking-wider text-[var(--sl-text-muted)] mb-2">
            Minutes
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            min="0"
            max="59"
            value={minutes}
            onChange={handleMinutesChange}
            disabled={disabled || isSubmitting}
            placeholder="0"
            className="glass-panel w-20 p-3 text-center text-[var(--text-body)] bg-transparent focus:outline-none focus:border-[var(--sl-border-bright)] disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isValid || disabled || isSubmitting}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Logging..." : "Log Time"}
        </button>
      </div>

      {!selectedSkillId && (
        <p className="text-[var(--text-xs)] text-[var(--sl-text-muted)] mt-3">
          Select a skill above to log time
        </p>
      )}
    </div>
  );
}
