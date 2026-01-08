// src/components/Dashboard/HealthBar.tsx
// Health bar component with critical state animation

import { motion } from "framer-motion";

interface HealthBarProps {
  current: number;
  max: number;
}

export function HealthBar({ current, max }: HealthBarProps): JSX.Element {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const isCritical = current <= 20;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[var(--text-xs)] uppercase text-[var(--sl-text-secondary)] font-semibold">
        HP
      </span>
      <div className="health-bar w-24">
        <motion.div
          className={`health-bar-fill ${isCritical ? "critical" : ""}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="text-[var(--text-xs)] text-[var(--sl-text-muted)] tabular-nums">
        {current}/{max}
      </span>
    </div>
  );
}
