// src/components/common/SwipeableViews.tsx
// Horizontal swipeable view container with drag gestures and slide animations

import { useRef } from "react";
import { motion, PanInfo } from "framer-motion";
import { useNavigationStore, getViewIndex, VIEW_ORDER } from "@/stores/navigationStore";

interface SwipeableViewsProps {
  children: React.ReactNode[];
}

export function SwipeableViews({ children }: SwipeableViewsProps): JSX.Element {
  const activeView = useNavigationStore((state) => state.activeView);
  const setActiveView = useNavigationStore((state) => state.setActiveView);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeIndex = getViewIndex(activeView);
  const viewCount = VIEW_ORDER.length;

  // Calculate the percentage offset for the active view
  // Since the motion.div is 300% wide, moving by 33.33% shows the next view
  const offsetPercent = -activeIndex * (100 / viewCount);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ): void => {
    const containerWidth = containerRef.current?.offsetWidth ?? window.innerWidth;
    const threshold = containerWidth * 0.15; // 15% of container width
    const velocityThreshold = 300; // pixels per second

    const offset = info.offset.x;
    const velocity = info.velocity.x;

    let newIndex = activeIndex;

    // Check velocity first (fast swipe)
    if (Math.abs(velocity) > velocityThreshold) {
      if (velocity > 0 && activeIndex > 0) {
        // Swipe right -> go to previous view (left)
        newIndex = activeIndex - 1;
      } else if (velocity < 0 && activeIndex < viewCount - 1) {
        // Swipe left -> go to next view (right)
        newIndex = activeIndex + 1;
      }
    } else {
      // Check distance threshold
      if (offset > threshold && activeIndex > 0) {
        // Dragged right enough -> go to previous view
        newIndex = activeIndex - 1;
      } else if (offset < -threshold && activeIndex < viewCount - 1) {
        // Dragged left enough -> go to next view
        newIndex = activeIndex + 1;
      }
    }

    // Update view if changed - Framer Motion handles the snap-back automatically
    if (newIndex !== activeIndex) {
      setActiveView(VIEW_ORDER[newIndex]);
    }
  };

  return (
    <div ref={containerRef} className="flex-1 min-h-0 overflow-hidden">
      <motion.div
        className="flex h-full"
        style={{ width: `${viewCount * 100}%` }}
        drag="x"
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={{ x: `${offsetPercent}%` }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      >
        {children.map((child, index) => (
          <div
            key={VIEW_ORDER[index] ?? index}
            className="h-full flex flex-col scroll-hidden-bar"
            style={{ width: `${100 / viewCount}%` }}
          >
            {child}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
