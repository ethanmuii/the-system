// src/lib/dailyResolution.ts
// Daily resolution logic for recurring quests and day transitions

import { query, execute, generateId } from "@/lib/db";
import type { RecurrencePattern } from "@/types";

interface RecurringQuestRow {
  id: string;
  skill_id: string;
  title: string;
  difficulty: string;
  recurrence_pattern: string;
}

interface PlayerLastProcessedRow {
  last_processed_date: string | null;
}

/**
 * Get today's date as YYYY-MM-DD string
 */
function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Check if a recurrence pattern matches a given date
 */
export function shouldGenerateForDate(
  pattern: RecurrencePattern,
  date: Date
): boolean {
  if (pattern.type === "daily") {
    return true;
  }

  if (pattern.type === "weekly") {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    return pattern.days?.includes(dayOfWeek) ?? false;
  }

  // Custom type with interval (not implemented for MVP)
  return false;
}

/**
 * Check if a quest for the given template already exists for a specific date
 */
async function questExistsForDate(
  title: string,
  skillId: string,
  dueDate: string
): Promise<boolean> {
  const rows = await query<{ count: number }>(
    "SELECT COUNT(*) as count FROM quests WHERE title = ? AND skill_id = ? AND due_date = ?",
    [title, skillId, dueDate]
  );
  return rows[0]?.count > 0;
}

/**
 * Generate recurring quests for a specific date
 */
export async function generateRecurringQuests(date: Date): Promise<number> {
  const dateString = date.toISOString().split("T")[0];
  let questsGenerated = 0;

  try {
    // Get all recurring quest templates
    const recurringQuests = await query<RecurringQuestRow>(
      "SELECT DISTINCT id, skill_id, title, difficulty, recurrence_pattern FROM quests WHERE is_recurring = 1 AND recurrence_pattern IS NOT NULL"
    );

    for (const template of recurringQuests) {
      const pattern = JSON.parse(template.recurrence_pattern) as RecurrencePattern;

      // Check if this pattern matches the target date
      if (!shouldGenerateForDate(pattern, date)) {
        continue;
      }

      // Check if a quest for this date already exists
      const exists = await questExistsForDate(
        template.title,
        template.skill_id,
        dateString
      );

      if (exists) {
        continue;
      }

      // Create new quest instance for this date
      const newId = generateId();
      await execute(
        `INSERT INTO quests (id, skill_id, title, difficulty, is_completed, is_recurring, recurrence_pattern, due_date, created_at)
         VALUES (?, ?, ?, ?, 0, 1, ?, ?, CURRENT_TIMESTAMP)`,
        [
          newId,
          template.skill_id,
          template.title,
          template.difficulty,
          template.recurrence_pattern,
          dateString,
        ]
      );

      questsGenerated++;
    }

    return questsGenerated;
  } catch (err) {
    console.error("Failed to generate recurring quests:", err);
    return 0;
  }
}

/**
 * Get the last processed date from player table
 */
async function getLastProcessedDate(): Promise<string | null> {
  try {
    const rows = await query<PlayerLastProcessedRow>(
      "SELECT last_processed_date FROM player WHERE id = 1"
    );
    return rows[0]?.last_processed_date ?? null;
  } catch {
    return null;
  }
}

/**
 * Update the last processed date in player table
 */
async function setLastProcessedDate(dateString: string): Promise<void> {
  try {
    await execute(
      "UPDATE player SET last_processed_date = ? WHERE id = 1",
      [dateString]
    );
  } catch (err) {
    console.error("Failed to update last processed date:", err);
  }
}

/**
 * Check if a new day has started and process daily resolution
 * Returns true if a new day was processed
 */
export async function checkAndProcessNewDay(): Promise<boolean> {
  const today = getTodayString();
  const lastProcessedDate = await getLastProcessedDate();

  // If already processed today, skip
  if (lastProcessedDate === today) {
    return false;
  }

  console.log(`Processing new day: ${today} (last processed: ${lastProcessedDate ?? "never"})`);

  try {
    // Generate recurring quests for today
    const questsGenerated = await generateRecurringQuests(new Date());
    if (questsGenerated > 0) {
      console.log(`Generated ${questsGenerated} recurring quest(s) for today`);
    }

    // Update the last processed date
    await setLastProcessedDate(today);

    return true;
  } catch (err) {
    console.error("Failed to process new day:", err);
    return false;
  }
}
