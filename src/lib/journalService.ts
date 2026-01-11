// src/lib/journalService.ts
// Database operations for journal_entries table

import { query, execute, generateId } from "@/lib/db";
import type { JournalEntry } from "@/types";

// Database row type (snake_case)
interface JournalEntryDbRow {
  id: string;
  content: string;
  entry_date: string;
  created_at: string;
  updated_at: string;
}

/**
 * Map database row to JournalEntry type
 */
function mapDbRowToJournalEntry(row: JournalEntryDbRow): JournalEntry {
  return {
    id: row.id,
    content: row.content,
    entryDate: new Date(row.entry_date),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Get today's date as YYYY-MM-DD string
 */
function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get today's journal entry, or null if none exists
 */
export async function getTodayEntry(): Promise<JournalEntry | null> {
  const today = getTodayDateString();
  const rows = await query<JournalEntryDbRow>(
    "SELECT * FROM journal_entries WHERE entry_date = ?",
    [today]
  );

  if (rows.length === 0) {
    return null;
  }

  return mapDbRowToJournalEntry(rows[0]);
}

/**
 * Get journal entry for a specific date
 */
export async function getEntryByDate(
  date: Date
): Promise<JournalEntry | null> {
  const dateString = date.toISOString().split("T")[0];
  const rows = await query<JournalEntryDbRow>(
    "SELECT * FROM journal_entries WHERE entry_date = ?",
    [dateString]
  );

  if (rows.length === 0) {
    return null;
  }

  return mapDbRowToJournalEntry(rows[0]);
}

/**
 * Save (insert or update) today's journal entry
 * Uses SQLite UPSERT to handle both insert and update
 */
export async function saveEntry(content: string): Promise<JournalEntry> {
  const today = getTodayDateString();
  const id = generateId();

  // Use UPSERT pattern: insert new or update existing based on entry_date unique constraint
  await execute(
    `INSERT INTO journal_entries (id, content, entry_date, created_at, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(entry_date) DO UPDATE SET
       content = excluded.content,
       updated_at = CURRENT_TIMESTAMP`,
    [id, content, today]
  );

  // Fetch the saved entry to return accurate timestamps
  const saved = await getTodayEntry();
  if (!saved) {
    throw new Error("Failed to save journal entry");
  }

  return saved;
}
