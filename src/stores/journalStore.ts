// src/stores/journalStore.ts
// Zustand store for journal state management with auto-save debounce

import { create } from "zustand";
import { getTodayEntry, saveEntry } from "@/lib/journalService";
import type { JournalEntry } from "@/types";

// Debounce timeout reference (module-level for cleanup)
let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

interface JournalStore {
  // State
  entry: JournalEntry | null;
  loading: boolean;
  error: string | null;
  isSaving: boolean;
  lastSaved: Date | null;
  pendingContent: string | null;

  // Actions
  fetchTodayEntry: () => Promise<void>;
  updateContent: (content: string) => void;
  saveNow: () => Promise<void>;
  cleanup: () => void;
}

export const useJournalStore = create<JournalStore>((set, get) => ({
  entry: null,
  loading: true,
  error: null,
  isSaving: false,
  lastSaved: null,
  pendingContent: null,

  fetchTodayEntry: async () => {
    set({ loading: true, error: null });
    try {
      const entry = await getTodayEntry();
      set({
        entry,
        loading: false,
        pendingContent: entry?.content ?? "",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch journal entry";
      set({ error: errorMessage, loading: false });
      console.error("Failed to fetch journal entry:", err);
    }
  },

  updateContent: (content: string) => {
    const { entry } = get();

    // Optimistic update - update local state immediately
    if (entry) {
      set({
        entry: { ...entry, content },
        pendingContent: content,
      });
    } else {
      // Create temporary entry for new content
      set({
        pendingContent: content,
        entry: {
          id: "pending",
          content,
          entryDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Clear existing debounce timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Set new debounce timeout (1 second)
    debounceTimeout = setTimeout(() => {
      get().saveNow();
    }, 1000);
  },

  saveNow: async () => {
    const { pendingContent, isSaving } = get();

    // Don't save if already saving or no content
    if (isSaving || pendingContent === null) {
      return;
    }

    set({ isSaving: true });

    try {
      const savedEntry = await saveEntry(pendingContent);
      set({
        entry: savedEntry,
        isSaving: false,
        lastSaved: new Date(),
        error: null,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save journal entry";
      set({ error: errorMessage, isSaving: false });
      console.error("Failed to save journal entry:", err);
    }
  },

  cleanup: () => {
    // Clear debounce timeout on unmount
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
      debounceTimeout = null;
    }
  },
}));
