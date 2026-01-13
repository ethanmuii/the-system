// src/components/common/NavArrow.tsx
// Circular navigation arrow buttons for swipe navigation

import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface NavArrowProps {
  direction: "left" | "right";
  onClick: () => void;
}

export function NavArrow({ direction, onClick }: NavArrowProps): JSX.Element {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;

  return (
    <motion.button
      onClick={onClick}
      className={`
        absolute top-1/2 -translate-y-1/2 z-20
        ${direction === "left" ? "left-1.5" : "right-1.5"}
        w-8 h-8 rounded-full
        flex items-center justify-center
        border border-[var(--sl-border-subtle)]
        bg-[var(--sl-bg-panel)]/30
        text-[var(--sl-text-muted)]
        opacity-30
        hover:opacity-100
        hover:bg-[var(--sl-bg-panel)]/60
        hover:border-[var(--sl-border-medium)]
        hover:text-[var(--sl-text-primary)]
        transition-all duration-200
        cursor-pointer
        backdrop-blur-sm
      `}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Navigate ${direction}`}
    >
      <Icon size={18} strokeWidth={2} />
    </motion.button>
  );
}
