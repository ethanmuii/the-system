// src/hooks/useQuests.ts
// Custom hook wrapping questsStore with computed values

import { useQuestsStore, CompleteQuestResult } from "@/stores/questsStore";
import type { Quest, CreateQuestInput, UpdateQuestInput } from "@/types";

interface UseQuestsReturn {
  // State from store
  quests: Quest[];
  loading: boolean;
  error: string | null;
  selectedQuestId: string | null;

  // Actions from store
  fetchQuests: () => Promise<void>;
  createQuest: (data: CreateQuestInput) => Promise<Quest>;
  updateQuest: (id: string, data: UpdateQuestInput) => Promise<void>;
  deleteQuest: (id: string) => Promise<void>;
  completeQuest: (id: string) => Promise<CompleteQuestResult>;
  selectQuest: (id: string | null) => void;

  // Computed values
  todayQuests: Quest[];
  pendingQuests: Quest[];
  completedQuests: Quest[];
  pendingCount: number;
  completedCount: number;
  totalTodayCount: number;
  selectedQuest: Quest | null;
  allQuestsComplete: boolean;
}

/**
 * Get today's date as YYYY-MM-DD string
 */
function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Convert a Date to YYYY-MM-DD string for comparison
 */
function dateToString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function useQuests(): UseQuestsReturn {
  const store = useQuestsStore();

  const today = getTodayString();

  // Filter quests for today
  const todayQuests = store.quests.filter(
    (q) => dateToString(q.dueDate) === today
  );

  // Sort: pending first (by difficulty desc), then completed
  const sortedTodayQuests = [...todayQuests].sort((a, b) => {
    // Completed quests go to the bottom
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    // Sort by difficulty (hard > medium > easy)
    const difficultyOrder = { hard: 0, medium: 1, easy: 2 };
    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
  });

  // Separate pending and completed
  const pendingQuests = sortedTodayQuests.filter((q) => !q.isCompleted);
  const completedQuests = sortedTodayQuests.filter((q) => q.isCompleted);

  // Get selected quest object
  const selectedQuest = store.selectedQuestId
    ? store.quests.find((q) => q.id === store.selectedQuestId) ?? null
    : null;

  // Check if all today's quests are complete
  const allQuestsComplete =
    todayQuests.length > 0 && pendingQuests.length === 0;

  return {
    // State from store
    quests: store.quests,
    loading: store.loading,
    error: store.error,
    selectedQuestId: store.selectedQuestId,

    // Actions from store
    fetchQuests: store.fetchQuests,
    createQuest: store.createQuest,
    updateQuest: store.updateQuest,
    deleteQuest: store.deleteQuest,
    completeQuest: store.completeQuest,
    selectQuest: store.selectQuest,

    // Computed values
    todayQuests: sortedTodayQuests,
    pendingQuests,
    completedQuests,
    pendingCount: pendingQuests.length,
    completedCount: completedQuests.length,
    totalTodayCount: todayQuests.length,
    selectedQuest,
    allQuestsComplete,
  };
}
