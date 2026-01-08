// src/lib/initDatabase.ts
// Database initialization and seeding for first run

import { execute, query } from "@/lib/db";
import { INITIAL_SKILLS } from "@/lib/initialData";

interface PlayerCountRow {
  count: number;
}

/**
 * Check if database has been initialized (player row exists)
 */
export async function isDbInitialized(): Promise<boolean> {
  try {
    const result = await query<PlayerCountRow>(
      "SELECT COUNT(*) as count FROM player WHERE id = 1"
    );
    return result.length > 0 && result[0].count > 0;
  } catch {
    // Table doesn't exist yet
    return false;
  }
}

/**
 * Create all database tables
 */
async function createTables(): Promise<void> {
  // Player table
  await execute(`
    CREATE TABLE IF NOT EXISTS player (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      overall_xp INTEGER NOT NULL DEFAULT 0,
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      health INTEGER NOT NULL DEFAULT 100,
      is_debuffed BOOLEAN NOT NULL DEFAULT FALSE,
      recovery_start_time DATETIME,
      recovery_accumulated_seconds INTEGER DEFAULT 0,
      last_processed_date DATE,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Skills table
  await execute(`
    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      total_xp INTEGER NOT NULL DEFAULT 0,
      total_seconds INTEGER NOT NULL DEFAULT 0,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Quests table
  await execute(`
    CREATE TABLE IF NOT EXISTS quests (
      id TEXT PRIMARY KEY,
      skill_id TEXT NOT NULL REFERENCES skills(id),
      title TEXT NOT NULL,
      difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
      is_completed BOOLEAN NOT NULL DEFAULT FALSE,
      is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
      recurrence_pattern TEXT,
      due_date DATE NOT NULL,
      completed_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Time logs table
  await execute(`
    CREATE TABLE IF NOT EXISTS time_logs (
      id TEXT PRIMARY KEY,
      skill_id TEXT NOT NULL REFERENCES skills(id),
      duration_seconds INTEGER NOT NULL,
      xp_earned INTEGER NOT NULL,
      source TEXT NOT NULL CHECK (source IN ('timer', 'manual')),
      logged_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Journal entries table
  await execute(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      entry_date DATE NOT NULL UNIQUE,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Daily snapshots table
  await execute(`
    CREATE TABLE IF NOT EXISTS daily_snapshots (
      id TEXT PRIMARY KEY,
      snapshot_date DATE NOT NULL UNIQUE,
      total_xp_earned INTEGER NOT NULL DEFAULT 0,
      total_seconds_logged INTEGER NOT NULL DEFAULT 0,
      quests_completed INTEGER NOT NULL DEFAULT 0,
      quests_total INTEGER NOT NULL DEFAULT 0,
      streak_count INTEGER NOT NULL DEFAULT 0,
      health INTEGER NOT NULL DEFAULT 100,
      skills_data TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  await execute(
    "CREATE INDEX IF NOT EXISTS idx_quests_due_date ON quests(due_date)"
  );
  await execute(
    "CREATE INDEX IF NOT EXISTS idx_quests_skill_id ON quests(skill_id)"
  );
  await execute(
    "CREATE INDEX IF NOT EXISTS idx_time_logs_skill_id ON time_logs(skill_id)"
  );
  await execute(
    "CREATE INDEX IF NOT EXISTS idx_time_logs_logged_at ON time_logs(logged_at)"
  );
  await execute(
    "CREATE INDEX IF NOT EXISTS idx_daily_snapshots_date ON daily_snapshots(snapshot_date)"
  );
}

/**
 * Seed initial data (player row + skills)
 */
async function seedInitialData(): Promise<void> {
  // Insert player row
  await execute("INSERT OR IGNORE INTO player (id) VALUES (1)");

  // Insert initial skills
  for (const skill of INITIAL_SKILLS) {
    await execute(
      `INSERT OR IGNORE INTO skills (id, name, icon, color, total_xp, total_seconds, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        skill.id,
        skill.name,
        skill.icon,
        skill.color,
        skill.totalXP,
        skill.totalSeconds,
        skill.displayOrder,
        skill.isActive ? 1 : 0,
      ]
    );
  }
}

/**
 * Initialize the database (create tables and seed data if needed)
 */
export async function initializeDatabase(): Promise<void> {
  const initialized = await isDbInitialized();

  if (!initialized) {
    console.log("Initializing database...");
    await createTables();
    await seedInitialData();
    console.log("Database initialized successfully");
  } else {
    console.log("Database already initialized");
  }
}
