// src/lib/dailyResolution.ts
// Daily resolution logic for recurring quests, streak/health updates, and day transitions

import { query, execute, generateId } from "@/lib/db";
import { calculateDailyHealth, shouldEnterDebuff, HEALTH_CONFIG } from "@/lib/xpCalculator";
import { createDailySnapshot } from "@/lib/snapshotService";
import type { RecurrencePattern } from "@/types";

interface RecurringQuestRow {
  id: string;
  skill_id: string;
  title: string;
  difficulty: string;
  recurrence_pattern: string;
}

interface PlayerRow {
  current_streak: number;
  longest_streak: number;
  health: number;
  is_debuffed: number;
  last_processed_date: string | null;
}

interface QuestCountRow {
  total: number;
  completed: number;
}

/**
 * Result of daily resolution processing
 */
export interface DailyResolutionResult {
  isNewDay: boolean;
  yesterdayComplete: boolean;
  questsCompleted: number;
  questsTotal: number;
  streakChange: "increment" | "reset" | "none";
  newStreak: number;
  healthChange: number;
  newHealth: number;
  enteredDebuff: boolean;
  questsGenerated: number;
}

/**
 * Get today's date as YYYY-MM-DD string
 */
function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get yesterday's date as YYYY-MM-DD string
 */
function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
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
 * Get player state from database
 */
async function getPlayerState(): Promise<PlayerRow | null> {
  try {
    const rows = await query<PlayerRow>(
      "SELECT current_streak, longest_streak, health, is_debuffed, last_processed_date FROM player WHERE id = 1"
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Get quest completion counts for a specific date
 */
async function getQuestCountsForDate(date: string): Promise<{ total: number; completed: number }> {
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
 * Update player streak in database
 */
async function updatePlayerStreak(newStreak: number, longestStreak: number): Promise<void> {
  await execute(
    "UPDATE player SET current_streak = ?, longest_streak = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
    [newStreak, longestStreak]
  );
}

/**
 * Update player health in database
 */
async function updatePlayerHealth(newHealth: number): Promise<void> {
  await execute(
    "UPDATE player SET health = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
    [newHealth]
  );
}

/**
 * Set player debuffed state in database
 */
async function setPlayerDebuffed(isDebuffed: boolean): Promise<void> {
  await execute(
    "UPDATE player SET is_debuffed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
    [isDebuffed ? 1 : 0]
  );
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
 * Returns detailed result for notifications
 */
export async function checkAndProcessNewDay(): Promise<DailyResolutionResult> {
  const today = getTodayString();
  const yesterday = getYesterdayString();

  // Default result for when no processing is needed
  const noOpResult: DailyResolutionResult = {
    isNewDay: false,
    yesterdayComplete: true,
    questsCompleted: 0,
    questsTotal: 0,
    streakChange: "none",
    newStreak: 0,
    healthChange: 0,
    newHealth: 100,
    enteredDebuff: false,
    questsGenerated: 0,
  };

  const playerState = await getPlayerState();
  if (!playerState) {
    console.error("Could not fetch player state");
    return noOpResult;
  }

  // If already processed today, skip
  if (playerState.last_processed_date === today) {
    return {
      ...noOpResult,
      newStreak: playerState.current_streak,
      newHealth: playerState.health,
    };
  }

  console.log(`Processing new day: ${today} (last processed: ${playerState.last_processed_date ?? "never"})`);

  try {
    // === Step 1: Check yesterday's quest completion ===
    const yesterdayQuests = await getQuestCountsForDate(yesterday);
    const hadQuestsYesterday = yesterdayQuests.total > 0;
    const completedAllYesterday = hadQuestsYesterday
      ? yesterdayQuests.completed === yesterdayQuests.total
      : true; // No quests = nothing to miss

    // === Step 2: Calculate streak change ===
    let newStreak = playerState.current_streak;
    let streakChange: "increment" | "reset" | "none" = "none";

    // Only apply streak logic if this isn't the first day (has processed before)
    // AND there were quests yesterday to evaluate
    if (playerState.last_processed_date !== null && hadQuestsYesterday) {
      if (completedAllYesterday) {
        newStreak = playerState.current_streak + 1;
        streakChange = "increment";
      } else {
        newStreak = 0;
        streakChange = "reset";
      }
    }

    const newLongestStreak = Math.max(playerState.longest_streak, newStreak);

    // === Step 3: Calculate health change ===
    let newHealth = playerState.health;
    let healthChange = 0;

    // Only apply health change if there were quests yesterday
    if (playerState.last_processed_date !== null && hadQuestsYesterday) {
      newHealth = calculateDailyHealth(playerState.health, completedAllYesterday);
      healthChange = completedAllYesterday
        ? HEALTH_CONFIG.dailyReward
        : HEALTH_CONFIG.dailyPenalty;

      // Clamp health
      if (newHealth > HEALTH_CONFIG.max) {
        healthChange = HEALTH_CONFIG.max - playerState.health;
        newHealth = HEALTH_CONFIG.max;
      }
    }

    // === Step 4: Check for debuff state ===
    const wasDebuffed = playerState.is_debuffed === 1;
    const shouldBeDebuffed = shouldEnterDebuff(newHealth);
    const enteredDebuff = !wasDebuffed && shouldBeDebuffed;

    // === Step 5: Update database ===
    if (streakChange !== "none") {
      await updatePlayerStreak(newStreak, newLongestStreak);
    }

    if (healthChange !== 0) {
      await updatePlayerHealth(newHealth);
    }

    if (enteredDebuff) {
      await setPlayerDebuffed(true);
    }

    // === Step 6: Create daily snapshot for yesterday ===
    if (playerState.last_processed_date !== null) {
      await createDailySnapshot(yesterday);
    }

    // === Step 7: Generate recurring quests for today ===
    const questsGenerated = await generateRecurringQuests(new Date());
    if (questsGenerated > 0) {
      console.log(`Generated ${questsGenerated} recurring quest(s) for today`);
    }

    // === Step 8: Update last processed date ===
    await setLastProcessedDate(today);

    console.log(`Daily resolution complete: streak=${newStreak}, health=${newHealth}, quests=${questsGenerated}`);

    return {
      isNewDay: true,
      yesterdayComplete: completedAllYesterday,
      questsCompleted: yesterdayQuests.completed,
      questsTotal: yesterdayQuests.total,
      streakChange,
      newStreak,
      healthChange,
      newHealth,
      enteredDebuff,
      questsGenerated,
    };
  } catch (err) {
    console.error("Failed to process new day:", err);
    return noOpResult;
  }
}
