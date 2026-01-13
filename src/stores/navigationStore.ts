// src/stores/navigationStore.ts
// Zustand store for navigation state management

import { create } from "zustand";
import type { View } from "@/types";

// View order: Journal (left) <- Dashboard (center) -> Timer (right)
export const VIEW_ORDER: View[] = ["journal", "dashboard", "timer"];

// Get the index of a view in the order
export function getViewIndex(view: View): number {
  return VIEW_ORDER.indexOf(view);
}

// Get adjacent views (what's to the left and right)
export function getAdjacentViews(current: View): { left: View | null; right: View | null } {
  const index = getViewIndex(current);
  return {
    left: index > 0 ? VIEW_ORDER[index - 1] : null,
    right: index < VIEW_ORDER.length - 1 ? VIEW_ORDER[index + 1] : null,
  };
}

interface NavigationStore {
  // State
  activeView: View;

  // Actions
  setActiveView: (view: View) => void;
  navigateLeft: () => void;
  navigateRight: () => void;
}

export const useNavigationStore = create<NavigationStore>((set, get) => ({
  activeView: "dashboard",

  setActiveView: (view: View) => {
    set({ activeView: view });
  },

  navigateLeft: () => {
    const { activeView } = get();
    const { left } = getAdjacentViews(activeView);
    if (left) {
      set({ activeView: left });
    }
  },

  navigateRight: () => {
    const { activeView } = get();
    const { right } = getAdjacentViews(activeView);
    if (right) {
      set({ activeView: right });
    }
  },
}));
