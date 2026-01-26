// src/components/common/RefreshConfirmDialog.tsx
// Confirmation dialog shown when user tries to refresh (Ctrl+R/F5) while a timer is running

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useTimerStore } from "@/stores/timerStore";
import { formatTime } from "@/lib/xpCalculator";
import { useSkillsStore } from "@/stores/skillsStore";

export function RefreshConfirmDialog(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  const isRunning = useTimerStore((state) => state.isRunning);
  const elapsedSeconds = useTimerStore((state) => state.elapsedSeconds);
  const skillId = useTimerStore((state) => state.skillId);
  const skills = useSkillsStore((state) => state.skills);
  const selectedSkill = skills.find((s) => s.id === skillId);

  // Listen for refresh keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Check for Ctrl+R or F5
      const isRefreshShortcut =
        (e.ctrlKey && e.key === "r") ||
        (e.ctrlKey && e.key === "R") ||
        e.key === "F5";

      if (isRefreshShortcut) {
        if (isRunning) {
          // Timer is running - prevent refresh and show dialog
          e.preventDefault();
          setIsOpen(true);
        }
        // If timer not running, let default refresh happen
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning]);

  const handleCancel = (): void => {
    setIsOpen(false);
  };

  const handleConfirmRefresh = (): void => {
    setIsOpen(false);
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={handleCancel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass-panel-elevated p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <AlertTriangle size={24} className="text-amber-400" />
                </div>
                <h2 className="text-[var(--text-h2)] font-bold">
                  Timer Running
                </h2>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 rounded-lg hover:bg-[var(--sl-bg-elevated)] transition-colors"
              >
                <X size={20} className="text-[var(--sl-text-muted)]" />
              </button>
            </div>

            {/* Message */}
            <div className="mb-6">
              <p className="text-[var(--sl-text-secondary)] mb-3">
                You have an active timer running. Refreshing now will lose your unsaved progress.
              </p>

              {/* Timer info */}
              <div className="bg-[var(--sl-bg-dark)]/50 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedSkill && (
                    <span className="text-lg">{selectedSkill.icon}</span>
                  )}
                  <span className="text-[var(--sl-text-primary)] font-medium">
                    {selectedSkill?.name ?? "Timer"}
                  </span>
                </div>
                <span className="font-mono text-purple-400 font-medium">
                  {formatTime(elapsedSeconds)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 rounded-lg border border-[var(--sl-border-subtle)] text-[var(--sl-text-secondary)] hover:bg-[var(--sl-bg-elevated)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRefresh}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white font-medium transition-colors"
              >
                Refresh Anyway
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
