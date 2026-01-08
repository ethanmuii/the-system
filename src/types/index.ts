// src/types/index.ts

export type Difficulty = "easy" | "medium" | "hard";
export type TimeLogSource = "timer" | "manual";

export interface Player {
  id: 1;
  overallXP: number;
  currentStreak: number;
  longestStreak: number;
  health: number;
  isDebuffed: boolean;
  recoveryStartTime: Date | null;
  recoveryAccumulatedSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Skill {
  id: string;
  name: string;
  icon: string;
  color: string;
  totalXP: number;
  totalSeconds: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Computed
  level: number;
  progress: number;
  totalHours: number;
}

export interface Quest {
  id: string;
  skillId: string;
  title: string;
  difficulty: Difficulty;
  isCompleted: boolean;
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern | null;
  dueDate: Date;
  completedAt: Date | null;
  createdAt: Date;
  // Computed
  xpReward: number;
}

export interface RecurrencePattern {
  type: "daily" | "weekly" | "custom";
  days?: number[]; // 0-6 for weekly (0 = Sunday)
  interval?: number; // Every N days for custom
}

export interface TimeLog {
  id: string;
  skillId: string;
  durationSeconds: number;
  xpEarned: number;
  source: TimeLogSource;
  loggedAt: Date;
}

export interface JournalEntry {
  id: string;
  content: string;
  entryDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailySnapshot {
  id: string;
  snapshotDate: Date;
  totalXPEarned: number;
  totalSecondsLogged: number;
  questsCompleted: number;
  questsTotal: number;
  streakCount: number;
  health: number;
  skillsData: Record<string, { xp: number; seconds: number; level: number }>;
  createdAt: Date;
}

// Timer state (not persisted, in-memory only)
export interface TimerState {
  isRunning: boolean;
  skillId: string | null;
  startTime: Date | null;
  elapsedSeconds: number;
  isPaused: boolean;
  pauseStartTime: Date | null;
  totalPauseSeconds: number;
}
