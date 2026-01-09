// src/components/Quests/XPIndicator.tsx
// Floating "+XP" animation component that appears on quest completion

import { motion } from "framer-motion";

interface XPIndicatorProps {
  xp: number;
  skillColor: string;
  onAnimationComplete: () => void;
}

export function XPIndicator({
  xp,
  skillColor,
  onAnimationComplete,
}: XPIndicatorProps): JSX.Element {
  return (
    <motion.div
      className="absolute right-4 top-1/2 pointer-events-none z-10"
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -40, scale: 1.2 }}
      transition={{
        duration: 1.5,
        ease: [0.16, 1, 0.3, 1],
      }}
      onAnimationComplete={onAnimationComplete}
      style={{
        color: skillColor,
        textShadow: `0 0 8px ${skillColor}, 0 0 16px ${skillColor}50`,
      }}
    >
      <span className="text-[var(--text-h2)] font-bold">+{xp} XP</span>
    </motion.div>
  );
}
