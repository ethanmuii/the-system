// src/components/Journal/JournalView.tsx
// Daily reflection journal view with auto-save

import { useEffect } from "react";
import { useJournalStore } from "@/stores/journalStore";
import { Loader2 } from "lucide-react";

/**
 * Format today's date for display
 */
function formatTodayDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format time for "Saved at HH:MM" display
 */
function formatSavedTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function JournalView(): JSX.Element {
  const {
    entry,
    loading,
    error,
    isSaving,
    lastSaved,
    fetchTodayEntry,
    updateContent,
    cleanup,
  } = useJournalStore();

  // Fetch today's entry on mount
  useEffect(() => {
    fetchTodayEntry();

    // Cleanup debounce timeout on unmount
    return () => {
      cleanup();
    };
  }, [fetchTodayEntry, cleanup]);

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center px-6">
        <div className="flex-[0.38] w-full" />
        <div className="max-w-3xl w-full">
          <h1 className="text-[var(--text-h1)] font-bold mb-6 uppercase tracking-wider">
            Daily Reflection
          </h1>
          <div className="glass-panel p-8 flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--sl-blue-ice)]" />
          </div>
        </div>
        <div className="flex-[0.62] w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center px-6">
        <div className="flex-[0.38] w-full" />
        <div className="max-w-3xl w-full">
          <h1 className="text-[var(--text-h1)] font-bold mb-6 uppercase tracking-wider">
            Daily Reflection
          </h1>
          <div className="glass-panel p-8">
            <p className="text-[var(--sl-danger)]">Error: {error}</p>
          </div>
        </div>
        <div className="flex-[0.62] w-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center px-6">
      {/* Top spacer - golden ratio 38% */}
      <div className="flex-[0.38] w-full" />

      {/* Content container */}
      <div className="max-w-3xl w-full">
        <h1 className="text-[var(--text-h1)] font-bold mb-6 uppercase tracking-wider">
          Daily Reflection
        </h1>

        <div className="glass-panel p-6">
          {/* Date Header */}
          <div className="panel-header -mx-6 -mt-6 mb-6 rounded-t-lg">
            <span className="text-[var(--sl-blue-ice)]">{formatTodayDate()}</span>
          </div>

          {/* Journal Textarea */}
          <textarea
            className="
              w-full h-[400px]
              bg-[var(--sl-bg-darkest)]
              border border-[var(--sl-border-subtle)]
              rounded-lg p-4
              text-[var(--sl-text-primary)]
              text-[var(--text-body)]
              resize-none
              focus:outline-none focus:border-[var(--sl-border-bright)]
              transition-colors duration-200
              placeholder:text-[var(--sl-text-muted)]
            "
            value={entry?.content ?? ""}
            onChange={(e) => updateContent(e.target.value)}
            placeholder="What did you accomplish today? What are your thoughts and reflections?"
          />

          {/* Save Status Indicator */}
          <div className="flex justify-end mt-4">
            <div className="flex items-center gap-2 text-[var(--text-xs)] text-[var(--sl-text-muted)]">
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : lastSaved ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-[var(--sl-success)]" />
                  <span>Saved at {formatSavedTime(lastSaved)}</span>
                </>
              ) : (
                <span>Auto-saves as you type</span>
              )}
            </div>
          </div>
        </div>

        {/* Help Text */}
        <p className="mt-4 text-[var(--text-xs)] text-[var(--sl-text-muted)] text-center">
          Your journal auto-saves 1 second after you stop typing.
        </p>
      </div>

      {/* Bottom spacer - golden ratio 62% */}
      <div className="flex-[0.62] w-full" />
    </div>
  );
}
