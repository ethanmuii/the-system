// src/stores/skillsStore.ts
// Zustand store for skills state management

import { create } from "zustand";
import { query, execute } from "@/lib/db";
import { calculateLevel, visualProgress } from "@/lib/xpCalculator";
import type { Skill } from "@/types";

// Database row type (snake_case)
interface SkillDbRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  total_xp: number;
  total_seconds: number;
  display_order: number;
  is_active: number; // SQLite boolean
  created_at: string;
  updated_at: string;
}

/**
 * Map database row to Skill type with computed properties
 */
function mapDbRowToSkill(row: SkillDbRow): Skill {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    totalXP: row.total_xp,
    totalSeconds: row.total_seconds,
    displayOrder: row.display_order,
    isActive: row.is_active === 1,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    // Computed properties
    level: calculateLevel(row.total_xp),
    progress: visualProgress(row.total_xp),
    totalHours: row.total_seconds / 3600,
  };
}

/**
 * Result of adding XP to a skill
 */
export interface AddXPResult {
  success: boolean;
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  skillName: string;
}

interface SkillsStore {
  // State
  skills: Skill[];
  loading: boolean;
  error: string | null;
  selectedSkillId: string | null;

  // Actions
  fetchSkills: () => Promise<void>;
  selectSkill: (skillId: string | null) => void;
  addXPToSkill: (
    skillId: string,
    xpAmount: number,
    seconds: number
  ) => Promise<AddXPResult>;
}

export const useSkillsStore = create<SkillsStore>((set, get) => ({
  skills: [],
  loading: true,
  error: null,
  selectedSkillId: null,

  fetchSkills: async () => {
    set({ loading: true, error: null });
    try {
      const rows = await query<SkillDbRow>(
        "SELECT * FROM skills ORDER BY display_order ASC"
      );

      const skills = rows.map(mapDbRowToSkill);

      set({ skills, loading: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch skills";
      set({ error: errorMessage, loading: false });
      console.error("Failed to fetch skills:", err);
    }
  },

  selectSkill: (skillId: string | null) => {
    set({ selectedSkillId: skillId });
  },

  addXPToSkill: async (skillId: string, xpAmount: number, seconds: number): Promise<AddXPResult> => {
    const { skills } = get();
    const skillIndex = skills.findIndex((s) => s.id === skillId);

    const failResult: AddXPResult = {
      success: false,
      leveledUp: false,
      oldLevel: 0,
      newLevel: 0,
      skillName: "",
    };

    if (skillIndex === -1) {
      console.error("Skill not found:", skillId);
      return failResult;
    }

    const skill = skills[skillIndex];
    const oldLevel = skill.level;
    const newTotalXP = skill.totalXP + xpAmount;
    const newTotalSeconds = skill.totalSeconds + seconds;
    const newLevel = calculateLevel(newTotalXP);

    try {
      await execute(
        "UPDATE skills SET total_xp = ?, total_seconds = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [newTotalXP, newTotalSeconds, skillId]
      );

      // Update skill with new computed values
      const updatedSkill: Skill = {
        ...skill,
        totalXP: newTotalXP,
        totalSeconds: newTotalSeconds,
        level: newLevel,
        progress: visualProgress(newTotalXP),
        totalHours: newTotalSeconds / 3600,
      };

      const updatedSkills = [...skills];
      updatedSkills[skillIndex] = updatedSkill;

      set({ skills: updatedSkills });

      return {
        success: true,
        leveledUp: newLevel > oldLevel,
        oldLevel,
        newLevel,
        skillName: skill.name,
      };
    } catch (err) {
      console.error("Failed to add XP to skill:", err);
      return failResult;
    }
  },
}));
