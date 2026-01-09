// src/stores/navigationStore.ts
// Zustand store for navigation state management

import { create } from "zustand";
import type { View } from "@/types";

interface NavigationStore {
  // State
  activeView: View;

  // Actions
  setActiveView: (view: View) => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  activeView: "dashboard",

  setActiveView: (view: View) => {
    set({ activeView: view });
  },
}));
