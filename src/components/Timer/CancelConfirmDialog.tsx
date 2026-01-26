// src/components/Timer/CancelConfirmDialog.tsx
// Confirmation dialog shown when user wants to cancel/discard a timer session

import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { formatTime } from "@/lib/xpCalculator";

interface CancelConfirmDialogProps {
  isOpen: boolean;
  skillName: string;
  elapsedSeconds: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CancelConfirmDialog({
  isOpen,
  skillName,
  elapsedSeconds,
  onCancel,
  onConfirm,
}: CancelConfirmDialogProps): JSX.Element | null {
  const dialogContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={onCancel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass-panel-elevated p-6 w-full max-w-sm rounded-xl"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <AlertTriangle size={24} className="text-red-400" />
                </div>
                <h2 className="text-[var(--text-h2)] font-bold">
                  Discard Session?
                </h2>
              </div>
              <button
                onClick={onCancel}
                className="p-2 rounded-lg hover:bg-[var(--sl-bg-elevated)] transition-colors"
              >
                <X size={20} className="text-[var(--sl-text-muted)]" />
              </button>
            </div>

            {/* Message */}
            <div className="mb-6">
              <p className="text-[var(--sl-text-secondary)] mb-3">
                This will discard all progress from your current session. No XP will be awarded.
              </p>

              {/* Session info */}
              <div className="bg-[var(--sl-bg-dark)]/50 rounded-lg p-3 flex items-center justify-between">
                <span className="text-[var(--sl-text-primary)] font-medium">
                  {skillName}
                </span>
                <span className="font-mono text-red-400 font-medium">
                  {formatTime(elapsedSeconds)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 rounded-lg border border-[var(--sl-border-subtle)] text-[var(--sl-text-secondary)] hover:bg-[var(--sl-bg-elevated)] transition-colors"
              >
                Keep Tracking
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white font-medium transition-colors"
              >
                Discard
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Use portal to render at document body level, escaping any parent stacking contexts
  return createPortal(dialogContent, document.body);
}
