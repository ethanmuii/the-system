// src/lib/dateUtils.test.ts
// Comprehensive tests for timezone handling and day boundary logic

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getLocalDateString,
  getLocalDateTimeString,
  getTodayString,
  parseLocalDate,
  getLocalYesterdayString,
} from "./dateUtils";

describe("dateUtils", () => {
  describe("getLocalDateString", () => {
    it("should return date in YYYY-MM-DD format", () => {
      const date = new Date(2026, 1, 3, 14, 30, 0); // Feb 3, 2026, 2:30 PM local
      const result = getLocalDateString(date);
      expect(result).toBe("2026-02-03");
    });

    it("should pad single digit month and day with zeros", () => {
      const date = new Date(2026, 0, 5, 10, 0, 0); // Jan 5, 2026
      const result = getLocalDateString(date);
      expect(result).toBe("2026-01-05");
    });

    it("should use current date when no argument provided", () => {
      const now = new Date();
      const result = getLocalDateString();
      const expected = getLocalDateString(now);
      expect(result).toBe(expected);
    });
  });

  describe("getLocalDateTimeString", () => {
    it("should return datetime in YYYY-MM-DD HH:MM:SS format", () => {
      const date = new Date(2026, 1, 3, 14, 30, 45); // Feb 3, 2026, 2:30:45 PM local
      const result = getLocalDateTimeString(date);
      expect(result).toBe("2026-02-03 14:30:45");
    });

    it("should pad all components with zeros", () => {
      const date = new Date(2026, 0, 5, 9, 5, 3); // Jan 5, 2026, 9:05:03 AM
      const result = getLocalDateTimeString(date);
      expect(result).toBe("2026-01-05 09:05:03");
    });

    it("should handle midnight correctly", () => {
      const date = new Date(2026, 1, 3, 0, 0, 0); // Feb 3, 2026, midnight
      const result = getLocalDateTimeString(date);
      expect(result).toBe("2026-02-03 00:00:00");
    });

    it("should handle 11:59 PM correctly (last minute of day)", () => {
      const date = new Date(2026, 1, 2, 23, 59, 59); // Feb 2, 2026, 11:59:59 PM
      const result = getLocalDateTimeString(date);
      expect(result).toBe("2026-02-02 23:59:59");
    });
  });

  describe("getTodayString", () => {
    it("should return same result as getLocalDateString with no args", () => {
      const result1 = getTodayString();
      const result2 = getLocalDateString();
      expect(result1).toBe(result2);
    });
  });

  describe("parseLocalDate", () => {
    it("should parse YYYY-MM-DD as local midnight", () => {
      const result = parseLocalDate("2026-02-03");
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1); // 0-indexed, Feb = 1
      expect(result.getDate()).toBe(3);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });

    it("should NOT interpret as UTC (which would shift the date in western timezones)", () => {
      // This test verifies that "2026-02-03" is parsed as local time, not UTC
      // If parsed as UTC, in EST (UTC-5), it would become Feb 2 at 7pm
      const result = parseLocalDate("2026-02-03");
      expect(result.getDate()).toBe(3); // Should be 3, not 2
    });
  });

  describe("getLocalYesterdayString", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return previous day", () => {
      vi.setSystemTime(new Date(2026, 1, 3, 14, 0, 0)); // Feb 3, 2026
      const result = getLocalYesterdayString();
      expect(result).toBe("2026-02-02");
    });

    it("should handle month boundary", () => {
      vi.setSystemTime(new Date(2026, 1, 1, 14, 0, 0)); // Feb 1, 2026
      const result = getLocalYesterdayString();
      expect(result).toBe("2026-01-31");
    });

    it("should handle year boundary", () => {
      vi.setSystemTime(new Date(2026, 0, 1, 14, 0, 0)); // Jan 1, 2026
      const result = getLocalYesterdayString();
      expect(result).toBe("2025-12-31");
    });
  });

  describe("Day Boundary Consistency (Critical Bug Fix Tests)", () => {
    /**
     * These tests verify the core fix for the timezone bug where time logged
     * at 11pm was being counted for both the current day and the next day.
     *
     * The issue: SQLite's datetime('now', 'localtime') might use a different
     * timezone context than JavaScript's Date object in a Tauri app.
     *
     * The fix: Generate timestamps in JavaScript and pass them explicitly to SQL.
     */

    it("getLocalDateTimeString date portion should match getLocalDateString", () => {
      // This is the key invariant: for any given moment, the date portion
      // of getLocalDateTimeString must match getLocalDateString
      const testCases = [
        new Date(2026, 1, 2, 23, 59, 59), // 11:59:59 PM
        new Date(2026, 1, 3, 0, 0, 0), // midnight
        new Date(2026, 1, 3, 0, 0, 1), // 12:00:01 AM
        new Date(2026, 1, 3, 12, 0, 0), // noon
        new Date(2026, 1, 3, 18, 0, 0), // 6 PM
        new Date(2026, 1, 3, 23, 0, 0), // 11 PM
      ];

      for (const date of testCases) {
        const dateTimeString = getLocalDateTimeString(date);
        const dateString = getLocalDateString(date);

        // Extract date portion from datetime string
        const datePortionFromDateTime = dateTimeString.split(" ")[0];

        expect(datePortionFromDateTime).toBe(dateString);
      }
    });

    it("time logged at 11pm should have same date as time logged at 10am same day", () => {
      const morning = new Date(2026, 1, 2, 10, 0, 0); // Feb 2, 10 AM
      const night = new Date(2026, 1, 2, 23, 0, 0); // Feb 2, 11 PM

      const morningDateTime = getLocalDateTimeString(morning);
      const nightDateTime = getLocalDateTimeString(night);

      // Both should have the same date portion
      expect(morningDateTime.split(" ")[0]).toBe("2026-02-02");
      expect(nightDateTime.split(" ")[0]).toBe("2026-02-02");
      expect(morningDateTime.split(" ")[0]).toBe(nightDateTime.split(" ")[0]);
    });

    it("time logged at 11:59:59 PM should be different date than 12:00:01 AM", () => {
      const beforeMidnight = new Date(2026, 1, 2, 23, 59, 59); // Feb 2, 11:59:59 PM
      const afterMidnight = new Date(2026, 1, 3, 0, 0, 1); // Feb 3, 12:00:01 AM

      const beforeDateTime = getLocalDateTimeString(beforeMidnight);
      const afterDateTime = getLocalDateTimeString(afterMidnight);

      expect(beforeDateTime.split(" ")[0]).toBe("2026-02-02");
      expect(afterDateTime.split(" ")[0]).toBe("2026-02-03");
    });
  });

  describe("SQL DATE() function simulation", () => {
    /**
     * These tests simulate how SQLite's DATE() function extracts dates
     * from our datetime strings. The DATE() function simply extracts
     * the date portion from a DATETIME string in YYYY-MM-DD HH:MM:SS format.
     */

    function simulateSqlDateExtraction(dateTimeString: string): string {
      // SQLite DATE() extracts the date portion from DATETIME
      return dateTimeString.split(" ")[0];
    }

    it("should correctly filter logs by today", () => {
      // Simulate today's date query
      const today = "2026-02-03";

      // Logs from today
      const todayMorning = getLocalDateTimeString(new Date(2026, 1, 3, 9, 0, 0));
      const todayNight = getLocalDateTimeString(new Date(2026, 1, 3, 23, 0, 0));

      // Logs from yesterday
      const yesterdayNight = getLocalDateTimeString(new Date(2026, 1, 2, 23, 0, 0));

      // Check which logs would be included in today's query
      expect(simulateSqlDateExtraction(todayMorning) === today).toBe(true);
      expect(simulateSqlDateExtraction(todayNight) === today).toBe(true);
      expect(simulateSqlDateExtraction(yesterdayNight) === today).toBe(false);
    });

    it("11pm log should NOT show up in next day query", () => {
      // This is the exact bug scenario:
      // User logs at 11pm EST on Feb 2
      // Next day (Feb 3), the query should NOT return this log

      const loggedAt11pmFeb2 = getLocalDateTimeString(new Date(2026, 1, 2, 23, 0, 0));
      const queryDateFeb3 = "2026-02-03";

      const wouldMatch = simulateSqlDateExtraction(loggedAt11pmFeb2) === queryDateFeb3;
      expect(wouldMatch).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle leap year", () => {
      const date = new Date(2024, 1, 29, 12, 0, 0); // Feb 29, 2024 (leap year)
      const result = getLocalDateString(date);
      expect(result).toBe("2024-02-29");
    });

    it("should handle end of year", () => {
      const date = new Date(2026, 11, 31, 23, 59, 59); // Dec 31, 2026, 11:59:59 PM
      const dateTime = getLocalDateTimeString(date);
      expect(dateTime).toBe("2026-12-31 23:59:59");
    });

    it("should handle start of year", () => {
      const date = new Date(2026, 0, 1, 0, 0, 0); // Jan 1, 2026, midnight
      const dateTime = getLocalDateTimeString(date);
      expect(dateTime).toBe("2026-01-01 00:00:00");
    });
  });
});
