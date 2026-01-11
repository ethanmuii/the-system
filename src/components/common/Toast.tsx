// src/components/common/Toast.tsx
// Toast notification container and individual toast components

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Info, AlertTriangle, AlertCircle, Sparkles } from "lucide-react";
import { useToastStore } from "@/stores/toastStore";
import type { Toast } from "@/types";

const TOAST_ICONS = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  levelup: Sparkles,
};

const TOAST_COLORS = {
  success: {
    bg: "bg-[var(--sl-success)]/20",
    border: "border-[var(--sl-success)]",
    icon: "text-[var(--sl-success)]",
  },
  info: {
    bg: "bg-[var(--sl-info)]/20",
    border: "border-[var(--sl-info)]",
    icon: "text-[var(--sl-info)]",
  },
  warning: {
    bg: "bg-[var(--sl-warning)]/20",
    border: "border-[var(--sl-warning)]",
    icon: "text-[var(--sl-warning)]",
  },
  error: {
    bg: "bg-[var(--sl-danger)]/20",
    border: "border-[var(--sl-danger)]",
    icon: "text-[var(--sl-danger)]",
  },
  levelup: {
    bg: "bg-[var(--sl-blue-glow)]/30",
    border: "border-[var(--sl-blue-ice)]",
    icon: "text-[var(--sl-blue-ice)]",
  },
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps): JSX.Element {
  const Icon = TOAST_ICONS[toast.type];
  const colors = TOAST_COLORS[toast.type];
  const isLevelUp = toast.type === "levelup";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={`
        glass-panel-elevated min-w-[300px] max-w-[400px]
        ${colors.bg} border-l-4 ${colors.border}
        flex items-start gap-3
        ${isLevelUp ? "p-5 border-2 border-[var(--sl-blue-ice)]" : "p-4"}
      `}
      style={isLevelUp ? {
        boxShadow: "0 0 20px rgba(96, 165, 250, 0.4), 0 0 40px rgba(96, 165, 250, 0.2)",
      } : undefined}
    >
      <Icon
        size={isLevelUp ? 28 : 20}
        className={`${colors.icon} ${isLevelUp ? "animate-pulse" : ""}`}
      />
      <div className="flex-1">
        {isLevelUp && (
          <p className="text-[var(--text-xs)] uppercase tracking-wider text-[var(--sl-blue-pale)] mb-1">
            Level Up!
          </p>
        )}
        <p className={`text-[var(--sl-text-primary)] ${isLevelUp ? "text-[var(--text-h3)] font-semibold" : "text-[var(--text-body)]"}`}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded hover:bg-black/20 transition-colors"
      >
        <X size={16} className="text-[var(--sl-text-muted)]" />
      </button>
    </motion.div>
  );
}

export function ToastContainer(): JSX.Element {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
