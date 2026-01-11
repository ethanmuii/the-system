// src/lib/snapshotService.ts
// Service for creating daily snapshots for analytics/history

import { query, execute, generateId } from "@/lib/db";
import { calculateLevel } from "@/lib/xpCalculator";

interface SkillRow {
  id: string;
  total_xp: number;
  total_seconds: number;
}

interface TimeLogSumRow {
  total_xp: number;
  total_seconds: number;
}

interface QuestCountRow {
  total: number;
  completed: number;
}

interface PlayerRow {
  current_streak: number;
  health: number;
}

interface SnapshotExistsRow {
  count: number;
}

export interface SnapshotData {
  totalXPEarned: number;
  totalSecondsLogged: number;
  questsCompleted: number;
  questsTotal: number;
  streakCount: number;
  health: number;
  skillsData: Record<string, { xp: number; seconds: number; level: number }>;
}

/**
 * Check if a snapshot already exists for a given date
 */
async function snapshotExists(date: string): Promise<boolean> {
  const rows = await query<SnapshotExistsRow>(
    "SELECT COUNT(*) as count FROM daily_snapshots WHERE snapshot_date = ?",
    [date]
  );
  return rows[0]?.count > 0;
}

/**
 * Get time log totals for a specific date
 */
async function getTimeLogTotals(date: string): Promise<{ xp: number; seconds: number }> {
  const rows = await query<TimeLogSumRow>(
    `SELECT
      COALESCE(SUM(xp_earned), 0) as total_xp,
      COALESCE(SUM(duration_seconds), 0) as total_seconds
    FROM time_logs
    WHERE DATE(logged_at) = ?`,
    [date]
  );
  return {
    xp: rows[0]?.total_xp ?? 0,
    seconds: rows[0]?.total_seconds ?? 0,
  };
}

/**
 * Get quest counts for a specific date
 */
async function getQuestCounts(date: string): Promise<{ total: number; completed: number }> {
  const rows = await query<QuestCountRow>(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed
    FROM quests
    WHERE due_date = ?`,
    [date]
  );
  return {
    total: rows[0]?.total ?? 0,
    completed: rows[0]?.completed ?? 0,
  };
}

/**
 * Get current player state
 */
async function getPlayerState(): Promise<{ streak: number; health: number }> {
  const rows = await query<PlayerRow>(
    "SELECT current_streak, health FROM player WHERE id = 1"
  );
  return {
    streak: rows[0]?.current_streak ?? 0,
    health: rows[0]?.health ?? 100,
  };
}

/**
 * Get current skills data for snapshot
 */
async function getSkillsSnapshot(): Promise<Record<string, { xp: number; seconds: number; level: number }>> {
  const rows = await query<SkillRow>(
    "SELECT id, total_xp, total_seconds FROM skills"
  );

  const skillsData: Record<string, { xp: number; seconds: number; level: number }> = {};

  for (const skill of rows) {
    skillsData[skill.id] = {
      xp: skill.total_xp,
      seconds: skill.total_seconds,
      level: calculateLevel(skill.total_xp),
    };
  }

  return skillsData;
}

/**
 * Create a daily snapshot for the given date
 * Gathers all data from time_logs, quests, player, and skills tables
 */
export async function createDailySnapshot(date: string): Promise<boolean> {
  try {
    // Check if snapshot already exists
    if (await snapshotExists(date)) {
      console.log(`Snapshot already exists for ${date}`);
      return false;
    }

    // Gather all data
    const timeLogTotals = await getTimeLogTotals(date);
    const questCounts = await getQuestCounts(date);
    const playerState = await getPlayerState();
    const skillsData = await getSkillsSnapshot();

    // Insert snapshot
    const id = generateId();
    await execute(
      `INSERT INTO daily_snapshots (
        id, snapshot_date, total_xp_earned, total_seconds_logged,
        quests_completed, quests_total, streak_count, health,
        skills_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        id,
        date,
        timeLogTotals.xp,
        timeLogTotals.seconds,
        questCounts.completed,
        questCounts.total,
        playerState.streak,
        playerState.health,
        JSON.stringify(skillsData),
      ]
    );

    console.log(`Created daily snapshot for ${date}`);
    return true;
  } catch (err) {
    console.error("Failed to create daily snapshot:", err);
    return false;
  }
}

/**
 * Gather snapshot data for a date without saving
 * Useful for getting yesterday's summary for notifications
 */
export async function gatherSnapshotData(date: string): Promise<SnapshotData> {
  const timeLogTotals = await getTimeLogTotals(date);
  const questCounts = await getQuestCounts(date);
  const playerState = await getPlayerState();
  const skillsData = await getSkillsSnapshot();

  return {
    totalXPEarned: timeLogTotals.xp,
    totalSecondsLogged: timeLogTotals.seconds,
    questsCompleted: questCounts.completed,
    questsTotal: questCounts.total,
    streakCount: playerState.streak,
    health: playerState.health,
    skillsData,
  };
}
