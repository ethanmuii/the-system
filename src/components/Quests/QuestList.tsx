// src/components/Quests/QuestList.tsx
// Container component for today's quests section

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useQuests } from "@/hooks/useQuests";
import { useSkills } from "@/hooks/useSkills";
import { useToastStore } from "@/stores/toastStore";
import { QuestItem } from "./QuestItem";
import { QuestModal } from "./QuestModal";
import { XPIndicator } from "./XPIndicator";

interface XPAnimation {
  questId: string;
  xp: number;
  skillColor: string;
}

export function QuestList(): JSX.Element {
  const {
    todayQuests,
    completedCount,
    totalTodayCount,
    loading,
    completeQuest,
    deleteQuest,
    selectQuest,
    selectedQuest,
  } = useQuests();

  const { skills } = useSkills();
  const addToast = useToastStore((state) => state.addToast);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);

  // XP animation state
  const [xpAnimations, setXpAnimations] = useState<XPAnimation[]>([]);

  // Get skill by ID
  const getSkill = useCallback(
    (skillId: string) => skills.find((s) => s.id === skillId),
    [skills]
  );

  // Handle quest completion
  const handleComplete = async (questId: string): Promise<void> => {
    try {
      const result = await completeQuest(questId);
      const skill = getSkill(result.skillId);

      // Add XP animation
      setXpAnimations((prev) => [
        ...prev,
        {
          questId,
          xp: result.xpAwarded,
          skillColor: skill?.color ?? "#3B82F6",
        },
      ]);

      // Show toast notification
      addToast({
        message: `+${result.xpAwarded} XP earned for ${skill?.name ?? "skill"}!`,
        type: "success",
      });
    } catch (err) {
      console.error("Failed to complete quest:", err);
      addToast({
        message: "Failed to complete quest",
        type: "error",
      });
    }
  };

  // Remove XP animation after it completes
  const handleAnimationComplete = (questId: string): void => {
    setXpAnimations((prev) => prev.filter((a) => a.questId !== questId));
  };

  // Handle edit
  const handleEdit = (questId: string): void => {
    setEditingQuestId(questId);
    selectQuest(questId);
    setIsModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (questId: string): Promise<void> => {
    try {
      await deleteQuest(questId);
      addToast({
        message: "Quest deleted",
        type: "info",
      });
    } catch (err) {
      console.error("Failed to delete quest:", err);
    }
  };

  // Handle modal close
  const handleModalClose = (): void => {
    setIsModalOpen(false);
    setEditingQuestId(null);
    selectQuest(null);
  };

  // Handle add new quest
  const handleAddQuest = (): void => {
    setEditingQuestId(null);
    selectQuest(null);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <section className="glass-panel p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-[var(--sl-bg-elevated)] rounded w-48 mb-4" />
          <div className="space-y-3">
            <div className="h-12 bg-[var(--sl-bg-elevated)] rounded" />
            <div className="h-12 bg-[var(--sl-bg-elevated)] rounded" />
            <div className="h-12 bg-[var(--sl-bg-elevated)] rounded" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[var(--text-h1)] font-semibold uppercase tracking-wider text-[var(--sl-text-primary)]">
          Today's Quests
          {totalTodayCount > 0 && (
            <span className="text-[var(--text-body)] text-[var(--sl-text-secondary)] ml-2 normal-case tracking-normal">
              ({completedCount}/{totalTodayCount} complete)
            </span>
          )}
        </h2>
        <button
          onClick={handleAddQuest}
          className="btn-primary flex items-center gap-2 text-[var(--text-small)]"
        >
          <Plus size={16} />
          Add Quest
        </button>
      </div>

      {/* Quest List */}
      {todayQuests.length === 0 ? (
        <div className="glass-panel p-8 text-center">
          <p className="text-[var(--sl-text-muted)] text-[var(--text-body)]">
            No quests for today. Add a quest to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {todayQuests.map((quest) => {
              const animation = xpAnimations.find(
                (a) => a.questId === quest.id
              );

              return (
                <div key={quest.id} className="relative">
                  <QuestItem
                    quest={quest}
                    skill={getSkill(quest.skillId)}
                    onComplete={handleComplete}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                  {/* XP Animation */}
                  {animation && (
                    <XPIndicator
                      xp={animation.xp}
                      skillColor={animation.skillColor}
                      onAnimationComplete={() =>
                        handleAnimationComplete(quest.id)
                      }
                    />
                  )}
                </div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Quest Modal */}
      <QuestModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        editingQuest={editingQuestId ? selectedQuest : null}
      />
    </section>
  );
}
