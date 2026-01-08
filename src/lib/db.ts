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
