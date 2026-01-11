// src/components/common/AnimatedNumber.tsx
// Animated number component for smooth XP counter count-up

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

// Module-level cache to persist values across component unmounts
// This allows animation to work when switching tabs
const valueCache = new Map<string, number>();

interface AnimatedNumberProps {
  /** The target value to animate to */
  value: number;
  /** Unique key to track this value across tab switches (e.g., "player-todayXP") */
  storageKey?: string;
  /** Animation duration in seconds (default: 0.5) */
  duration?: number;
  /** Optional formatter function for display */
  formatter?: (n: number) => string;
  /** Optional className for styling */
  className?: string;
}

/**
 * AnimatedNumber component
 *
 * Smoothly animates between number values using Framer Motion.
 * Used for XP counters and other numeric displays that should
 * count up/down smoothly when values change.
 *
 * When storageKey is provided, the component remembers its last value
 * even when unmounted (e.g., switching tabs), and animates from the
 * last seen value when re-mounted.
 */
export function AnimatedNumber({
  value,
  storageKey,
  duration = 0.5,
  formatter,
  className,
}: AnimatedNumberProps): JSX.Element {
  const isFirstRender = useRef(true);

  // Get the starting value - either from cache or current value
  const getStartValue = (): number => {
    if (storageKey && valueCache.has(storageKey)) {
      return valueCache.get(storageKey)!;
    }
    return value;
  };

  const motionValue = useMotionValue(getStartValue());

  // Transform the motion value to a displayable string
  const displayValue = useTransform(motionValue, (latest) => {
    const rounded = Math.round(latest);
    return formatter ? formatter(rounded) : rounded.toLocaleString();
  });

  // Animate to new value when it changes or on mount
  useEffect(() => {
    // On first render, animate from cached value (or current if no cache)
    // On subsequent renders, animate from current motionValue position
    const startValue = isFirstRender.current ? getStartValue() : motionValue.get();
    isFirstRender.current = false;

    // Only animate if there's a difference
    if (Math.abs(startValue - value) > 0.5) {
      motionValue.set(startValue);
      const controls = animate(motionValue, value, {
        duration,
        ease: [0.16, 1, 0.3, 1], // ease-out-expo
      });

      // Store the final value in cache for next mount
      if (storageKey) {
        valueCache.set(storageKey, value);
      }

      return () => controls.stop();
    } else {
      // No animation needed, just set the value
      motionValue.set(value);
      if (storageKey) {
        valueCache.set(storageKey, value);
      }
    }
  }, [value, duration, motionValue, storageKey]);

  return <motion.span className={className}>{displayValue}</motion.span>;
}
