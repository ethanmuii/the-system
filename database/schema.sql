-- ARISE Database Schema
-- SQLite database for player state, skills, quests, and time tracking

-- Player state (single row)
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
);

-- Skills
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
);

-- Quests (daily tasks)
CREATE TABLE IF NOT EXISTS quests (
  id TEXT PRIMARY KEY,
  skill_id TEXT NOT NULL REFERENCES skills(id),
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_pattern TEXT, -- JSON: {"type": "daily"} or {"type": "weekly", "days": [1,3,5]}
  due_date DATE NOT NULL,
  completed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Time logs
CREATE TABLE IF NOT EXISTS time_logs (
  id TEXT PRIMARY KEY,
  skill_id TEXT NOT NULL REFERENCES skills(id),
  duration_seconds INTEGER NOT NULL,
  xp_earned INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('timer', 'manual')),
  logged_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Journal entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  entry_date DATE NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Daily snapshots (for history/analytics)
CREATE TABLE IF NOT EXISTS daily_snapshots (
  id TEXT PRIMARY KEY,
  snapshot_date DATE NOT NULL UNIQUE,
  total_xp_earned INTEGER NOT NULL DEFAULT 0,
  total_seconds_logged INTEGER NOT NULL DEFAULT 0,
  quests_completed INTEGER NOT NULL DEFAULT 0,
  quests_total INTEGER NOT NULL DEFAULT 0,
  streak_count INTEGER NOT NULL DEFAULT 0,
  health INTEGER NOT NULL DEFAULT 100,
  skills_data TEXT NOT NULL, -- JSON snapshot of all skills
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quests_due_date ON quests(due_date);
CREATE INDEX IF NOT EXISTS idx_quests_skill_id ON quests(skill_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_skill_id ON time_logs(skill_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_logged_at ON time_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_daily_snapshots_date ON daily_snapshots(snapshot_date);

-- Initialize player row if not exists
INSERT OR IGNORE INTO player (id) VALUES (1);
