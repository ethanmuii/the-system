// src/components/Quests/QuestModal.tsx
// Modal for creating and editing quests

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useQuests } from "@/hooks/useQuests";
import { useSkills } from "@/hooks/useSkills";
import { QUEST_XP } from "@/lib/xpCalculator";
import { getTodayString, getLocalDateString } from "@/lib/dateUtils";
import type { Quest, Difficulty, RecurrencePattern } from "@/types";

interface QuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingQuest: Quest | null;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function QuestModal({
  isOpen,
  onClose,
  editingQuest,
}: QuestModalProps): JSX.Element | null {
  const { createQuest, updateQuest } = useQuests();
  const { activeSkills } = useSkills();

  // Form state
  const [title, setTitle] = useState("");
  const [skillId, setSkillId] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [dueDate, setDueDate] = useState(getTodayString());
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<"daily" | "weekly">("daily");
  const [weeklyDays, setWeeklyDays] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track previous isOpen state to detect when modal opens
  const wasOpen = useRef(false);

  // Reset form only when modal transitions from closed to open
  useEffect(() => {
    // Only run when modal opens (transition from false to true)
    if (isOpen && !wasOpen.current) {
      if (editingQuest) {
        setTitle(editingQuest.title);
        setSkillId(editingQuest.skillId);
        setDifficulty(editingQuest.difficulty);
        setDueDate(getLocalDateString(editingQuest.dueDate));
        setIsRecurring(editingQuest.isRecurring);
        if (editingQuest.recurrencePattern) {
          setRecurrenceType(editingQuest.recurrencePattern.type as "daily" | "weekly");
          setWeeklyDays(editingQuest.recurrencePattern.days ?? []);
        } else {
          setRecurrenceType("daily");
          setWeeklyDays([]);
        }
      } else {
        // Create mode - reset form with first skill as default
        setTitle("");
        setSkillId(activeSkills[0]?.id ?? "");
        setDifficulty("medium");
        setDueDate(getTodayString());
        setIsRecurring(false);
        setRecurrenceType("daily");
        setWeeklyDays([]);
      }
    }
    wasOpen.current = isOpen;
  }, [isOpen, editingQuest, activeSkills]);

  const toggleWeeklyDay = (day: number): void => {
    setWeeklyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const buildRecurrencePattern = (): RecurrencePattern | null => {
    if (!isRecurring) return null;
    if (recurrenceType === "daily") return { type: "daily" };
    return { type: "weekly", days: weeklyDays.sort((a, b) => a - b) };
  };

  const handleSubmit = async (): Promise<void> => {
    if (!title.trim() || !skillId) return;
    setIsSubmitting(true);

    try {
      const recurrencePattern = buildRecurrencePattern();

      if (editingQuest) {
        await updateQuest(editingQuest.id, {
          title: title.trim(),
          skillId,
          difficulty,
          dueDate,
          isRecurring,
          recurrencePattern,
        });
      } else {
        await createQuest({
          title: title.trim(),
          skillId,
          difficulty,
          dueDate,
          isRecurring,
          recurrencePattern,
        });
      }

      onClose();
    } catch (err) {
      console.error("Failed to save quest:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Use portal to render outside of transformed parent (SwipeableViews)
  // This ensures fixed positioning works correctly relative to viewport
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/70"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[var(--sl-text-primary)]">
            {editingQuest ? "Edit Quest" : "New Quest"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--sl-bg-elevated)] transition-colors"
          >
            <X size={20} className="text-[var(--sl-text-muted)]" />
          </button>
        </div>

        {/* Title Input */}
        <div className="mb-4">
          <label className="block text-xs text-[var(--sl-text-secondary)] uppercase tracking-wider mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you want to accomplish?"
            className="w-full p-3 bg-[var(--sl-bg-elevated)] text-[var(--sl-text-primary)] rounded-lg
              border border-[var(--sl-border-subtle)]
              focus:outline-none focus:border-[var(--sl-blue-glow)]
              placeholder:text-[var(--sl-text-muted)]"
          />
        </div>

        {/* Skill Selection */}
        <div className="mb-4">
          <label className="block text-xs text-[var(--sl-text-secondary)] uppercase tracking-wider mb-2">
            Skill
          </label>
          <select
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
            className="w-full p-3 bg-[var(--sl-bg-panel)] text-[var(--sl-text-primary)] rounded-lg
              border border-[var(--sl-border-subtle)]
              focus:outline-none focus:border-[var(--sl-blue-glow)]"
          >
            {activeSkills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.icon} {skill.name}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div className="mb-4">
          <label className="block text-xs text-[var(--sl-text-secondary)] uppercase tracking-wider mb-2">
            Difficulty
          </label>
          <div className="flex gap-2">
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`flex-1 p-3 rounded-lg border transition-all text-center ${
                  difficulty === d
                    ? d === "easy"
                      ? "bg-[var(--sl-success)]/20 border-[var(--sl-success)] text-[var(--sl-success)]"
                      : d === "medium"
                        ? "bg-[var(--sl-warning)]/20 border-[var(--sl-warning)] text-[var(--sl-warning)]"
                        : "bg-[var(--sl-danger)]/20 border-[var(--sl-danger)] text-[var(--sl-danger)]"
                    : "border-[var(--sl-border-subtle)] text-[var(--sl-text-secondary)] hover:border-[var(--sl-border-medium)]"
                }`}
              >
                <div className="text-sm font-semibold capitalize">{d}</div>
                <div className="text-xs opacity-80">+{QUEST_XP[d]} XP</div>
              </button>
            ))}
          </div>
        </div>

        {/* Due Date */}
        <div className="mb-4">
          <label className="block text-xs text-[var(--sl-text-secondary)] uppercase tracking-wider mb-2">
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={getTodayString()}
            className="w-full p-3 bg-[var(--sl-bg-panel)] text-[var(--sl-text-primary)] rounded-lg
              border border-[var(--sl-border-subtle)]
              focus:outline-none focus:border-[var(--sl-blue-glow)]"
          />
        </div>

        {/* Recurring Toggle */}
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => setIsRecurring(!isRecurring)}
            className={`px-4 py-2 rounded-lg border transition-all ${
              isRecurring
                ? "bg-[var(--sl-blue-primary)] border-[var(--sl-blue-primary)] text-white"
                : "border-[var(--sl-border-subtle)] text-[var(--sl-text-secondary)]"
            }`}
          >
            {isRecurring ? "Recurring" : "Not Recurring"}
          </button>
        </div>

        {/* Recurrence Pattern */}
        {isRecurring && (
          <div className="mb-4 pl-4 border-l-2 border-[var(--sl-border-subtle)]">
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setRecurrenceType("daily")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  recurrenceType === "daily"
                    ? "bg-[var(--sl-blue-primary)] text-white"
                    : "bg-[var(--sl-bg-elevated)] text-[var(--sl-text-secondary)]"
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setRecurrenceType("weekly")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  recurrenceType === "weekly"
                    ? "bg-[var(--sl-blue-primary)] text-white"
                    : "bg-[var(--sl-bg-elevated)] text-[var(--sl-text-secondary)]"
                }`}
              >
                Weekly
              </button>
            </div>

            {recurrenceType === "weekly" && (
              <div className="flex gap-1">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeeklyDay(day.value)}
                    className={`w-9 h-9 rounded-lg text-xs font-medium ${
                      weeklyDays.includes(day.value)
                        ? "bg-[var(--sl-blue-primary)] text-white"
                        : "bg-[var(--sl-bg-elevated)] text-[var(--sl-text-secondary)]"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary flex-1"
            disabled={isSubmitting || !title.trim() || !skillId}
          >
            {isSubmitting ? "Saving..." : editingQuest ? "Save Changes" : "Create Quest"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
