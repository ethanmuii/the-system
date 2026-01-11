// src/hooks/useSkills.ts
// Custom hook wrapping skillsStore with computed values

import { useSkillsStore, AddXPResult } from "@/stores/skillsStore";
import type { Skill } from "@/types";

interface UseSkillsReturn {
  // State from store
  skills: Skill[];
  loading: boolean;
  error: string | null;
  selectedSkillId: string | null;

  // Actions from store
  fetchSkills: () => Promise<void>;
  selectSkill: (skillId: string | null) => void;
  addXPToSkill: (
    skillId: string,
    xpAmount: number,
    seconds: number
  ) => Promise<AddXPResult>;

  // Computed values
  sortedSkills: Skill[];
  activeSkills: Skill[];
  selectedSkill: Skill | null;
  totalXP: number;
  totalHours: number;
}

export function useSkills(): UseSkillsReturn {
  const store = useSkillsStore();

  // Compute derived values
  const sortedSkills = [...store.skills].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );
  const activeSkills = sortedSkills.filter((s) => s.isActive);
  const selectedSkill = store.selectedSkillId
    ? store.skills.find((s) => s.id === store.selectedSkillId) ?? null
    : null;

  // Aggregate stats
  const totalXP = store.skills.reduce((sum, s) => sum + s.totalXP, 0);
  const totalHours = store.skills.reduce((sum, s) => sum + s.totalHours, 0);

  return {
    // State
    skills: store.skills,
    loading: store.loading,
    error: store.error,
    selectedSkillId: store.selectedSkillId,

    // Actions
    fetchSkills: store.fetchSkills,
    selectSkill: store.selectSkill,
    addXPToSkill: store.addXPToSkill,

    // Computed
    sortedSkills,
    activeSkills,
    selectedSkill,
    totalXP,
    totalHours,
  };
}
