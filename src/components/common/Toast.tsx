// src/components/common/Toast.tsx
// Toast notification container and individual toast components

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from "lucide-react";
import { useToastStore } from "@/stores/toastStore";
import type { Toast } from "@/types";

const TOAST_ICONS = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
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
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps): JSX.Element {
  const Icon = TOAST_ICONS[toast.type];
  const colors = TOAST_COLORS[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={`
        glass-panel-elevated p-4 min-w-[300px] max-w-[400px]
        ${colors.bg} border-l-4 ${colors.border}
        flex items-start gap-3
      `}
    >
      <Icon size={20} className={colors.icon} />
      <p className="flex-1 text-[var(--text-body)] text-[var(--sl-text-primary)]">
        {toast.message}
      </p>
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
