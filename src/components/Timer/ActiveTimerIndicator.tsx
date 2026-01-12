// src/components/Timer/ActiveTimerIndicator.tsx
// Persistent timer indicator that appears when a timer is running and user is on a different tab.
// Styled as a curved "bookmark" pull-tab anchored to the top of the screen.

import { motion, AnimatePresence } from "framer-motion";
import { Timer } from "lucide-react";
import { useTimerStore } from "@/stores/timerStore";
import { useSkillsStore } from "@/stores/skillsStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { formatTime } from "@/lib/xpCalculator";

export function ActiveTimerIndicator(): JSX.Element | null {
  const isRunning = useTimerStore((state) => state.isRunning);
  const isPaused = useTimerStore((state) => state.isPaused);
  const elapsedSeconds = useTimerStore((state) => state.elapsedSeconds);
  const skillId = useTimerStore((state) => state.skillId);
  const activeView = useNavigationStore((state) => state.activeView);
  const setActiveView = useNavigationStore((state) => state.setActiveView);

  const skills = useSkillsStore((state) => state.skills);
  const selectedSkill = skills.find((s) => s.id === skillId);

  // Only show when timer is running AND we're not on the timer tab
  const shouldShow = isRunning && activeView !== "timer";

  const handleClick = (): void => {
    setActiveView("timer");
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 left-1/2 -translate-x-1/2 z-50"
        >
          <button
            onClick={handleClick}
            className="group relative focus:outline-none"
            aria-label="Return to timer"
          >
            {/* The curved bookmark shape using SVG for smooth curves */}
            <svg
              width="160"
              height="44"
              viewBox="0 0 160 44"
              fill="none"
              className="drop-shadow-lg"
            >
              {/* Main shape - curved bottom like a bookmark tab */}
              <path
                d="M0 0 H160 V28 Q150 28 140 36 Q130 44 80 44 Q30 44 20 36 Q10 28 0 28 Z"
                className={`
                  transition-all duration-300
                  ${isPaused
                    ? "fill-amber-900/90"
                    : "fill-[var(--sl-bg-dark)]/95"
                  }
                `}
                stroke="rgba(139, 92, 246, 0.3)"
                strokeWidth="1"
              />
            </svg>

            {/* Content overlay */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 pb-2">
              {/* Pulsing timer icon */}
              <motion.div
                animate={isPaused ? {} : {
                  scale: [1, 1.1, 1],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Timer
                  size={14}
                  className={`
                    ${isPaused
                      ? "text-amber-400"
                      : "text-purple-400"
                    }
                  `}
                />
              </motion.div>

              {/* Time display */}
              <span
                className={`
                  font-mono text-sm font-medium
                  ${isPaused
                    ? "text-amber-300"
                    : "text-white"
                  }
                `}
              >
                {formatTime(elapsedSeconds)}
              </span>

              {/* Skill name (truncated) */}
              {selectedSkill && (
                <>
                  <span className="text-white/30">|</span>
                  <span className="text-xs text-white/60 max-w-[50px] truncate">
                    {selectedSkill.name}
                  </span>
                </>
              )}
            </div>

            {/* Glow effect for running state */}
            {!isPaused && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                  boxShadow: [
                    "0 4px 20px rgba(139, 92, 246, 0.3)",
                    "0 4px 30px rgba(139, 92, 246, 0.5)",
                    "0 4px 20px rgba(139, 92, 246, 0.3)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  borderRadius: "0 0 50% 50%",
                }}
              />
            )}

            {/* Hover hint */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              <span className="text-[10px] text-white/40">Click to return</span>
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
