// src/lib/dateUtils.ts
// Centralized date utilities for consistent local-timezone handling
//
// IMPORTANT: This module ensures all date operations use the user's local timezone,
// not UTC. This fixes the issue where day boundaries would occur at UTC midnight
// (e.g., 7 PM EST) instead of local midnight.

/**
 * Get a date as YYYY-MM-DD string in local timezone
 * @param date - Date object (defaults to current date/time)
 * @returns Date string in YYYY-MM-DD format
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string as local midnight (not UTC)
 *
 * Note: Using just `new Date("2026-01-12")` interprets the date as UTC midnight,
 * which becomes the previous day in western timezones. Appending "T00:00:00"
 * forces interpretation as local time.
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object set to midnight local time
 */
export function parseLocalDate(dateString: string): Date {
  return new Date(dateString + "T00:00:00");
}

/**
 * Get yesterday's date as YYYY-MM-DD in local timezone
 * @returns Yesterday's date string in YYYY-MM-DD format
 */
export function getLocalYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDateString(yesterday);
}

/**
 * Get today's date as YYYY-MM-DD in local timezone
 * Alias for getLocalDateString() with no arguments, for semantic clarity
 * @returns Today's date string in YYYY-MM-DD format
 */
export function getTodayString(): string {
  return getLocalDateString();
}
