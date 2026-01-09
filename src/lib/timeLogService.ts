// src/lib/timeLogService.ts
// Database operations for time_logs table

import { query, execute, generateId } from "@/lib/db";
import {
  secondsToHours,
  TIME_XP_RATE,
  getStreakMultiplier,
  DEBUFF_MULTIPLIER,
} from "@/lib/xpCalculator";
import type { TimeLog, TimeLogSource } from "@/types";

// Database row type (snake_case)
interface TimeLogDbRow {
  id: string;
  skill_id: string;
  duration_seconds: number;
  xp_earned: number;
  source: string;
  logged_at: string;
}

/**
 * Map database row to TimeLog type
 */
function mapDbRowToTimeLog(row: TimeLogDbRow): TimeLog {
  return {
    id: row.id,
    skillId: row.skill_id,
    durationSeconds: row.duration_seconds,
    xpEarned: row.xp_earned,
    source: row.source as TimeLogSource,
    loggedAt: new Date(row.logged_at),
  };
}

export interface LogTimeResult {
  timeLog: TimeLog;
  xpEarned: number;
}

/**
 * Calculate XP for a time session with all multipliers applied
 */
export function calculateTimeXPWithMultipliers(
  durationSeconds: number,
  streakDays: number,
  isDebuffed: boolean
): number {
  const hours = secondsToHours(durationSeconds);
  const streakMultiplier = getStreakMultiplier(streakDays);
  let xp = Math.floor(hours * TIME_XP_RATE * streakMultiplier);

  if (isDebuffed) {
    xp = Math.floor(xp * DEBUFF_MULTIPLIER);
  }

  return xp;
}

/**
 * Log time and create time_log entry in database
 */
export async function logTime(
  skillId: string,
  durationSeconds: number,
  source: TimeLogSource,
  streakDays: number,
  isDebuffed: boolean
): Promise<LogTimeResult> {
  const id = generateId();
  const xpEarned = calculateTimeXPWithMultipliers(
    durationSeconds,
    streakDays,
    isDebuffed
  );

  // Insert into database
  await execute(
    `INSERT INTO time_logs (id, skill_id, duration_seconds, xp_earned, source, logged_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [id, skillId, durationSeconds, xpEarned, source]
  );

  const timeLog: TimeLog = {
    id,
    skillId,
    durationSeconds,
    xpEarned,
    source,
    loggedAt: new Date(),
  };

  return { timeLog, xpEarned };
}

/**
 * Get time logs for today
 */
export async function getTodayTimeLogs(): Promise<TimeLog[]> {
  const today = new Date().toISOString().split("T")[0];
  const rows = await query<TimeLogDbRow>(
    "SELECT * FROM time_logs WHERE DATE(logged_at) = ? ORDER BY logged_at DESC",
    [today]
  );
  return rows.map(mapDbRowToTimeLog);
}

/**
 * Get time logs for a specific skill
 */
export async function getTimeLogsBySkill(skillId: string): Promise<TimeLog[]> {
  const rows = await query<TimeLogDbRow>(
    "SELECT * FROM time_logs WHERE skill_id = ? ORDER BY logged_at DESC",
    [skillId]
  );
  return rows.map(mapDbRowToTimeLog);
}

/**
 * Get total time logged today in seconds
 */
export async function getTodayTotalSeconds(): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const result = await query<{ total: number }>(
    "SELECT COALESCE(SUM(duration_seconds), 0) as total FROM time_logs WHERE DATE(logged_at) = ?",
    [today]
  );
  return result[0]?.total ?? 0;
}
