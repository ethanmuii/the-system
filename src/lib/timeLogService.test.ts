// src/lib/timeLogService.test.ts
// Integration tests for time log timezone handling
//
// These tests document and verify the fix for the timezone bug where
// time logged at 11pm was being counted for both the current day and the next day.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getLocalDateTimeString, getTodayString, getLocalDateString } from "./dateUtils";

// Mock database functions for testing the logic without actual SQLite
vi.mock("@/lib/db", () => ({
  query: vi.fn(),
  execute: vi.fn(),
  generateId: vi.fn(() => "test-id-123"),
}));

vi.mock("@/lib/xpCalculator", () => ({
  secondsToHours: (s: number) => s / 3600,
  TIME_XP_RATE: 100,
  getStreakMultiplier: () => 1.0,
  DEBUFF_MULTIPLIER: 0.5,
}));

describe("Time Log Timezone Handling", () => {
  describe("Timestamp Consistency", () => {
    /**
     * This test verifies the core invariant that fixes the timezone bug:
     * The timestamp we store must have a date portion that matches
     * getTodayString() at the moment of logging.
     */
    it("should generate timestamps where DATE portion matches getTodayString", () => {
      // Test at various times of day
      const times = [
        { hour: 0, minute: 0, desc: "midnight" },
        { hour: 9, minute: 0, desc: "9 AM" },
        { hour: 12, minute: 0, desc: "noon" },
        { hour: 18, minute: 0, desc: "6 PM" },
        { hour: 23, minute: 0, desc: "11 PM" },
        { hour: 23, minute: 59, desc: "11:59 PM" },
      ];

      for (const time of times) {
        const date = new Date(2026, 1, 3, time.hour, time.minute, 0);

        // This simulates what we now do in the code
        const storedTimestamp = getLocalDateTimeString(date);
        const todayAtThatMoment = getLocalDateString(date);

        // The DATE portion of the stored timestamp should match "today"
        const datePortion = storedTimestamp.split(" ")[0];
        expect(datePortion).toBe(todayAtThatMoment);
      }
    });
  });

  describe("SQL Query Simulation", () => {
    /**
     * These tests simulate the actual SQL query pattern:
     * SELECT * FROM time_logs WHERE DATE(logged_at) = ?
     *
     * The ? parameter is getTodayString()
     */

    function simulateQuery(storedTimestamp: string, queryDate: string): boolean {
      // SQLite's DATE() function extracts the date portion
      const storedDate = storedTimestamp.split(" ")[0];
      return storedDate === queryDate;
    }

    it("should return logs from the same day only", () => {
      const today = "2026-02-03";

      // Logs stored today at various times
      const todayMorning = "2026-02-03 09:00:00";
      const todayEvening = "2026-02-03 21:00:00";
      const todayLateNight = "2026-02-03 23:30:00";

      // Logs from yesterday
      const yesterdayLateNight = "2026-02-02 23:30:00";

      // Logs from tomorrow
      const tomorrowEarlyMorning = "2026-02-04 00:01:00";

      // Today's logs should match
      expect(simulateQuery(todayMorning, today)).toBe(true);
      expect(simulateQuery(todayEvening, today)).toBe(true);
      expect(simulateQuery(todayLateNight, today)).toBe(true);

      // Yesterday's logs should NOT match
      expect(simulateQuery(yesterdayLateNight, today)).toBe(false);

      // Tomorrow's logs should NOT match
      expect(simulateQuery(tomorrowEarlyMorning, today)).toBe(false);
    });

    it("should correctly handle the 11pm scenario (the original bug)", () => {
      // SCENARIO: User logs time at 11pm EST on Feb 2nd
      // EXPECTED: This should count for Feb 2nd, NOT Feb 3rd

      const loggedAt = new Date(2026, 1, 2, 23, 0, 0); // Feb 2, 11 PM
      const storedTimestamp = getLocalDateTimeString(loggedAt);

      // When queried on Feb 2nd (same day as logging)
      const feb2Query = "2026-02-02";
      expect(simulateQuery(storedTimestamp, feb2Query)).toBe(true);

      // When queried on Feb 3rd (next day)
      const feb3Query = "2026-02-03";
      expect(simulateQuery(storedTimestamp, feb3Query)).toBe(false);
    });

    it("should correctly handle midnight boundary", () => {
      // Log at 11:59:59 PM on Feb 2nd
      const beforeMidnight = new Date(2026, 1, 2, 23, 59, 59);
      const beforeTimestamp = getLocalDateTimeString(beforeMidnight);

      // Log at 12:00:01 AM on Feb 3rd
      const afterMidnight = new Date(2026, 1, 3, 0, 0, 1);
      const afterTimestamp = getLocalDateTimeString(afterMidnight);

      const feb2 = "2026-02-02";
      const feb3 = "2026-02-03";

      // Before midnight should count for Feb 2nd only
      expect(simulateQuery(beforeTimestamp, feb2)).toBe(true);
      expect(simulateQuery(beforeTimestamp, feb3)).toBe(false);

      // After midnight should count for Feb 3rd only
      expect(simulateQuery(afterTimestamp, feb2)).toBe(false);
      expect(simulateQuery(afterTimestamp, feb3)).toBe(true);
    });
  });

  describe("XP Aggregation Simulation", () => {
    /**
     * This simulates how todayXP is calculated on app load.
     * The query is: SELECT xp_earned FROM time_logs WHERE DATE(logged_at) = ?
     */

    interface MockTimeLog {
      logged_at: string;
      xp_earned: number;
    }

    function calculateTodayXP(logs: MockTimeLog[], today: string): number {
      return logs
        .filter(log => log.logged_at.split(" ")[0] === today)
        .reduce((sum, log) => sum + log.xp_earned, 0);
    }

    it("should only sum XP from today's logs", () => {
      const logs: MockTimeLog[] = [
        // Yesterday's logs
        { logged_at: "2026-02-02 10:00:00", xp_earned: 100 },
        { logged_at: "2026-02-02 23:30:00", xp_earned: 50 },  // 11:30 PM yesterday

        // Today's logs
        { logged_at: "2026-02-03 09:00:00", xp_earned: 200 },
        { logged_at: "2026-02-03 15:00:00", xp_earned: 150 },
        { logged_at: "2026-02-03 22:00:00", xp_earned: 75 },  // 10 PM today
      ];

      const todayXP = calculateTodayXP(logs, "2026-02-03");

      // Should only include today's logs: 200 + 150 + 75 = 425
      expect(todayXP).toBe(425);

      // Should NOT include yesterday's 11:30 PM log (50 XP)
      // This was the original bug - the 50 XP would have been included
    });
  });
});

describe("Fix Verification", () => {
  /**
   * These tests verify the specific fix we implemented:
   * Using getLocalDateTimeString() instead of SQLite's datetime('now', 'localtime')
   */

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("getLocalDateTimeString uses JavaScript's timezone, not SQLite's", () => {
    // Set system time to 11pm EST on Feb 2nd
    vi.setSystemTime(new Date(2026, 1, 2, 23, 0, 0));

    const timestamp = getLocalDateTimeString();
    const today = getTodayString();

    // Both should agree it's Feb 2nd
    expect(timestamp.startsWith("2026-02-02")).toBe(true);
    expect(today).toBe("2026-02-02");

    // The timestamp should be 23:00:00
    expect(timestamp).toBe("2026-02-02 23:00:00");
  });

  it("getLocalDateTimeString and getTodayString are consistent at all hours", () => {
    // Test at every hour of the day
    for (let hour = 0; hour < 24; hour++) {
      vi.setSystemTime(new Date(2026, 1, 3, hour, 30, 0));

      const timestamp = getLocalDateTimeString();
      const today = getTodayString();

      const timestampDate = timestamp.split(" ")[0];
      expect(timestampDate).toBe(today);
    }
  });
});
