// src/lib/db.ts
// Database utility functions for SQLite via Tauri

import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

/**
 * Get or create database connection
 */
export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:arise.db");
  }
  return db;
}

/**
 * Execute a SELECT query and return results
 */
export async function query<T>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const database = await getDb();
  return database.select<T[]>(sql, params);
}

/**
 * Execute an INSERT, UPDATE, or DELETE query
 */
export async function execute(
  sql: string,
  params: unknown[] = []
): Promise<{ rowsAffected: number; lastInsertId?: number }> {
  const database = await getDb();
  return database.execute(sql, params);
}

/**
 * Generate a UUID for new records
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Execute a callback within a database transaction.
 * If the callback throws, the transaction is rolled back.
 * If the callback succeeds, the transaction is committed.
 *
 * Uses SQLite's IMMEDIATE transaction mode to acquire a write lock
 * at the start, preventing other writers from interleaving.
 *
 * @param callback - Async function containing DB operations
 * @returns The result of the callback
 * @throws Re-throws any error from the callback after rollback
 */
export async function transaction<T>(
  callback: () => Promise<T>
): Promise<T> {
  const database = await getDb();

  // BEGIN IMMEDIATE acquires a write lock immediately, preventing
  // other transactions from writing until this one completes
  await database.execute("BEGIN IMMEDIATE TRANSACTION");

  try {
    const result = await callback();
    await database.execute("COMMIT");
    return result;
  } catch (error) {
    // Attempt rollback - if this fails, the connection may be in a bad state
    // but we still want to propagate the original error
    try {
      await database.execute("ROLLBACK");
    } catch (rollbackError) {
      console.error("Failed to rollback transaction:", rollbackError);
    }
    throw error;
  }
}
