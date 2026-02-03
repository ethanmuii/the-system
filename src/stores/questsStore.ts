// src/stores/questsStore.ts
// Zustand store for quest state management

import { create } from "zustand";
import { query, execute, generateId } from "@/lib/db";
import { QUEST_XP, getStreakMultiplier, DEBUFF_MULTIPLIER, calculateLevel, visualProgress } from "@/lib/xpCalculator";
import { parseLocalDate, getLocalDateTimeString } from "@/lib/dateUtils";
import { useSkillsStore } from "@/stores/skillsStore";
import { usePlayerStore } from "@/stores/playerStore";
import type { Quest, Difficulty, RecurrencePattern, CreateQuestInput, UpdateQuestInput } from "@/types";

// Database row type (snake_case)
interface QuestDbRow {
  id: string;
  skill_id: string;
  title: string;
  difficulty: string;
  is_completed: number; // SQLite boolean
  is_recurring: number; // SQLite boolean
  recurrence_pattern: string | null; // JSON string
  due_date: string;
  completed_at: string | null;
  created_at: string;
}

/**
 * Map database row to Quest type with computed properties
 */
function mapDbRowToQuest(row: QuestDbRow): Quest {
  const difficulty = row.difficulty as Difficulty;
  return {
    id: row.id,
    skillId: row.skill_id,
    title: row.title,
    difficulty,
    isCompleted: row.is_completed === 1,
    isRecurring: row.is_recurring === 1,
    recurrencePattern: row.recurrence_pattern
      ? (JSON.parse(row.recurrence_pattern) as RecurrencePattern)
      : null,
    dueDate: parseLocalDate(row.due_date),
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    createdAt: new Date(row.created_at),
    // Computed property
    xpReward: QUEST_XP[difficulty],
  };
}

/**
 * Result of completing a quest
 */
export interface CompleteQuestResult {
  xpAwarded: number;
  skillId: string;
  skillName: string;
  leveledUp: boolean;
  newLevel: number;
}

interface QuestsStore {
  // State
  quests: Quest[];
  loading: boolean;
  error: string | null;
  selectedQuestId: string | null;
  completingQuestIds: Set<string>; // Lock: quests currently being completed

  // Actions
  fetchQuests: () => Promise<void>;
  createQuest: (data: CreateQuestInput) => Promise<Quest>;
  updateQuest: (id: string, data: UpdateQuestInput) => Promise<void>;
  deleteQuest: (id: string) => Promise<void>;
  completeQuest: (id: string) => Promise<CompleteQuestResult>;
  selectQuest: (id: string | null) => void;
  isCompletingQuest: (id: string) => boolean; // Check if quest completion is in progress
}

export const useQuestsStore = create<QuestsStore>((set, get) => ({
  quests: [],
  loading: true,
  error: null,
  selectedQuestId: null,
  completingQuestIds: new Set<string>(),

  isCompletingQuest: (id: string) => {
    return get().completingQuestIds.has(id);
  },

  fetchQuests: async () => {
    set({ loading: true, error: null });
    try {
      const rows = await query<QuestDbRow>(
        "SELECT * FROM quests ORDER BY due_date ASC, created_at ASC"
      );

      const quests = rows.map(mapDbRowToQuest);

      set({ quests, loading: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch quests";
      set({ error: errorMessage, loading: false });
      console.error("Failed to fetch quests:", err);
    }
  },

  createQuest: async (data: CreateQuestInput) => {
    const id = generateId();
    const recurrencePatternJson = data.recurrencePattern
      ? JSON.stringify(data.recurrencePattern)
      : null;

    try {
      await execute(
        `INSERT INTO quests (id, skill_id, title, difficulty, is_completed, is_recurring, recurrence_pattern, due_date, created_at)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          id,
          data.skillId,
          data.title,
          data.difficulty,
          data.isRecurring ? 1 : 0,
          recurrencePatternJson,
          data.dueDate,
        ]
      );

      const newQuest: Quest = {
        id,
        skillId: data.skillId,
        title: data.title,
        difficulty: data.difficulty,
        isCompleted: false,
        isRecurring: data.isRecurring,
        recurrencePattern: data.recurrencePattern,
        dueDate: parseLocalDate(data.dueDate),
        completedAt: null,
        createdAt: new Date(),
        xpReward: QUEST_XP[data.difficulty],
      };

      set({ quests: [...get().quests, newQuest] });

      return newQuest;
    } catch (err) {
      console.error("Failed to create quest:", err);
      throw err;
    }
  },

  updateQuest: async (id: string, data: UpdateQuestInput) => {
    const { quests } = get();
    const questIndex = quests.findIndex((q) => q.id === id);

    if (questIndex === -1) {
      console.error("Quest not found:", id);
      return;
    }

    const quest = quests[questIndex];

    // Don't allow updating completed quests
    if (quest.isCompleted) {
      console.error("Cannot update completed quest:", id);
      return;
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const params: unknown[] = [];

    if (data.title !== undefined) {
      updates.push("title = ?");
      params.push(data.title);
    }
    if (data.skillId !== undefined) {
      updates.push("skill_id = ?");
      params.push(data.skillId);
    }
    if (data.difficulty !== undefined) {
      updates.push("difficulty = ?");
      params.push(data.difficulty);
    }
    if (data.dueDate !== undefined) {
      updates.push("due_date = ?");
      params.push(data.dueDate);
    }
    if (data.isRecurring !== undefined) {
      updates.push("is_recurring = ?");
      params.push(data.isRecurring ? 1 : 0);
    }
    if (data.recurrencePattern !== undefined) {
      updates.push("recurrence_pattern = ?");
      params.push(
        data.recurrencePattern ? JSON.stringify(data.recurrencePattern) : null
      );
    }

    if (updates.length === 0) return;

    params.push(id);

    try {
      await execute(
        `UPDATE quests SET ${updates.join(", ")} WHERE id = ?`,
        params
      );

      // Update local state
      const updatedQuest: Quest = {
        ...quest,
        title: data.title ?? quest.title,
        skillId: data.skillId ?? quest.skillId,
        difficulty: data.difficulty ?? quest.difficulty,
        dueDate: data.dueDate ? parseLocalDate(data.dueDate) : quest.dueDate,
        isRecurring: data.isRecurring ?? quest.isRecurring,
        recurrencePattern:
          data.recurrencePattern !== undefined
            ? data.recurrencePattern
            : quest.recurrencePattern,
        xpReward: QUEST_XP[data.difficulty ?? quest.difficulty],
      };

      const updatedQuests = [...quests];
      updatedQuests[questIndex] = updatedQuest;

      set({ quests: updatedQuests });
    } catch (err) {
      console.error("Failed to update quest:", err);
    }
  },

  deleteQuest: async (id: string) => {
    const { quests } = get();
    const quest = quests.find((q) => q.id === id);

    if (!quest) {
      console.error("Quest not found:", id);
      return;
    }

    // Don't allow deleting completed quests
    if (quest.isCompleted) {
      console.error("Cannot delete completed quest:", id);
      return;
    }

    try {
      await execute("DELETE FROM quests WHERE id = ?", [id]);

      set({ quests: quests.filter((q) => q.id !== id) });
    } catch (err) {
      console.error("Failed to delete quest:", err);
    }
  },

  completeQuest: async (id: string) => {
    const { quests, completingQuestIds } = get();

    // ═══════════════════════════════════════════════════════════════════
    // STEP 1: SYNCHRONOUS VALIDATION & LOCK ACQUISITION
    // This prevents race conditions from double-clicks
    // ═══════════════════════════════════════════════════════════════════

    // Check if already completing this quest (prevents double-click race condition)
    if (completingQuestIds.has(id)) {
      throw new Error("Quest completion already in progress");
    }

    const questIndex = quests.findIndex((q) => q.id === id);
    if (questIndex === -1) {
      throw new Error("Quest not found");
    }

    const quest = quests[questIndex];
    if (quest.isCompleted) {
      throw new Error("Quest already completed");
    }

    // Acquire lock SYNCHRONOUSLY before any async operations
    const newCompletingIds = new Set(completingQuestIds);
    newCompletingIds.add(id);
    set({ completingQuestIds: newCompletingIds });

    // ═══════════════════════════════════════════════════════════════════
    // STEP 2: OPTIMISTIC UI UPDATE
    // Mark quest complete immediately for responsive UI
    // ═══════════════════════════════════════════════════════════════════

    const completedAt = new Date();
    const optimisticQuest: Quest = {
      ...quest,
      isCompleted: true,
      completedAt,
    };

    const optimisticQuests = [...quests];
    optimisticQuests[questIndex] = optimisticQuest;
    set({ quests: optimisticQuests });

    // ═══════════════════════════════════════════════════════════════════
    // STEP 3: CALCULATE XP
    // ═══════════════════════════════════════════════════════════════════

    const playerState = usePlayerStore.getState();
    const player = playerState.player;
    const streakMultiplier = player ? getStreakMultiplier(player.currentStreak) : 1.0;
    const isDebuffed = player?.isDebuffed ?? false;

    let xpAwarded = Math.floor(QUEST_XP[quest.difficulty] * streakMultiplier);
    if (isDebuffed) {
      xpAwarded = Math.floor(xpAwarded * DEBUFF_MULTIPLIER);
    }

    // Get current skill state for level calculation
    const skillsState = useSkillsStore.getState();
    const skill = skillsState.skills.find((s) => s.id === quest.skillId);
    if (!skill) {
      // Rollback optimistic update
      set({ quests, completingQuestIds });
      throw new Error("Skill not found for quest");
    }

    const oldLevel = skill.level;
    const newTotalXP = skill.totalXP + xpAwarded;
    const newLevel = calculateLevel(newTotalXP);
    const leveledUp = newLevel > oldLevel;
    const timeLogId = generateId();

    // ═══════════════════════════════════════════════════════════════════
    // STEP 4: DATABASE OPERATIONS
    // Execute sequentially - the synchronous lock prevents race conditions
    // ═══════════════════════════════════════════════════════════════════

    try {
      // 4a. Mark quest as completed
      await execute(
        "UPDATE quests SET is_completed = 1, completed_at = ? WHERE id = ?",
        [completedAt.toISOString(), id]
      );

      // 4b. Award XP to skill
      await execute(
        "UPDATE skills SET total_xp = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [newTotalXP, quest.skillId]
      );

      // 4c. Log quest XP to time_logs (for todayXP persistence)
      // Use JavaScript-generated timestamp for consistent timezone handling
      const timeLogLoggedAt = getLocalDateTimeString();
      await execute(
        `INSERT INTO time_logs (id, skill_id, duration_seconds, xp_earned, source, logged_at)
         VALUES (?, ?, 0, ?, 'quest', ?)`,
        [timeLogId, quest.skillId, xpAwarded, timeLogLoggedAt]
      );

      // ═════════════════════════════════════════════════════════════════
      // STEP 5: UPDATE ZUSTAND STATE (only after successful transaction)
      // ═════════════════════════════════════════════════════════════════

      // Update skill in skillsStore
      const updatedSkill = {
        ...skill,
        totalXP: newTotalXP,
        level: newLevel,
        progress: visualProgress(newTotalXP),
      };

      const updatedSkills = [...skillsState.skills];
      const skillIndex = updatedSkills.findIndex((s) => s.id === quest.skillId);
      if (skillIndex !== -1) {
        updatedSkills[skillIndex] = updatedSkill;
        useSkillsStore.setState({ skills: updatedSkills });
      }

      // Update today's XP in player store
      usePlayerStore.setState((state) => ({
        todayXP: state.todayXP + xpAwarded,
      }));

      // Release lock (quest stays completed)
      const finalCompletingIds = new Set(get().completingQuestIds);
      finalCompletingIds.delete(id);
      set({ completingQuestIds: finalCompletingIds });

      return {
        xpAwarded,
        skillId: quest.skillId,
        skillName: skill.name,
        leveledUp,
        newLevel,
      };
    } catch (err) {
      // ═════════════════════════════════════════════════════════════════
      // STEP 6: ROLLBACK ON ERROR
      // Restore original state if transaction failed
      // ═════════════════════════════════════════════════════════════════

      console.error("Failed to complete quest (transaction rolled back):", err);

      // Rollback optimistic quest update
      set({ quests });

      // Release lock
      const rollbackCompletingIds = new Set(get().completingQuestIds);
      rollbackCompletingIds.delete(id);
      set({ completingQuestIds: rollbackCompletingIds });

      throw err;
    }
  },

  selectQuest: (id: string | null) => {
    set({ selectedQuestId: id });
  },
}));
