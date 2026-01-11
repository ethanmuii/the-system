// src/components/Timer/TimerView.tsx
// Main container for timer functionality

import { useState, useCallback, useEffect } from "react";
import { useTimer } from "@/hooks/useTimer";
import { useSkills } from "@/hooks/useSkills";
import { usePlayer } from "@/hooks/usePlayer";
import { usePlayerStore } from "@/stores/playerStore";
import { useToastStore } from "@/stores/toastStore";
import { TimerDisplay } from "./TimerDisplay";
import { TimerControls } from "./TimerControls";
import { SkillSelector } from "./SkillSelector";
import { ManualTimeEntry } from "./ManualTimeEntry";
import { RecoveryQuestBanner } from "./RecoveryQuestBanner";
import {
  secondsToHours,
  TIME_XP_RATE,
  DEBUFF_MULTIPLIER,
  formatXP,
  HEALTH_CONFIG,
} from "@/lib/xpCalculator";
import { logTime } from "@/lib/timeLogService";
import {
  getRecoveryProgress,
  updateRecoveryProgress,
  startRecoveryTracking,
  isPauseExceeded,
} from "@/lib/recoveryService";

export function TimerView(): JSX.Element {
  const [pendingSkillId, setPendingSkillId] = useState<string | null>(null);
  const [recoveryAccumulated, setRecoveryAccumulated] = useState(0);

  const {
    isRunning,
    isPaused,
    skillId,
    selectedSkill,
    formattedTime,
    elapsedSeconds,
    currentPauseDuration,
    start,
    pause,
    resume,
    stop,
  } = useTimer();

  const { addXPToSkill, activeSkills } = useSkills();
  const { player, streakMultiplier } = usePlayer();
  const setDebuffed = usePlayerStore((state) => state.setDebuffed);
  const updateHealth = usePlayerStore((state) => state.updateHealth);
  const addToast = useToastStore((state) => state.addToast);

  // Check if player is debuffed
  const isDebuffed = player?.isDebuffed ?? false;

  // Initialize recovery state when component mounts or debuff status changes
  useEffect(() => {
    if (isDebuffed) {
      const progress = getRecoveryProgress();
      setRecoveryAccumulated(progress.accumulatedSeconds);

      // Start tracking if not already active
      if (!progress.isActive) {
        startRecoveryTracking();
      }
    } else {
      setRecoveryAccumulated(0);
    }
  }, [isDebuffed]);

  // Get skill color for display
  const displaySkill = selectedSkill ?? activeSkills.find((s) => s.id === pendingSkillId);
  const skillColor = displaySkill?.color;

  // Handle skill selection
  const handleSkillSelect = useCallback((newSkillId: string) => {
    setPendingSkillId(newSkillId);
  }, []);

  // Handle start
  const handleStart = useCallback(() => {
    if (pendingSkillId) {
      start(pendingSkillId);
    }
  }, [pendingSkillId, start]);

  // Handle stop and save
  const handleStop = useCallback(async () => {
    const result = stop();
    if (!result || !player) return;

    const { skillId: stoppedSkillId, elapsedSeconds: totalSeconds, totalPauseSeconds: sessionPause } = result;

    // Create time log entry and get XP earned
    const { xpEarned } = await logTime(
      stoppedSkillId,
      totalSeconds,
      "timer",
      player.currentStreak,
      player.isDebuffed
    );

    // Award XP to skill (updates skill totalXP and totalSeconds)
    const xpResult = await addXPToSkill(stoppedSkillId, xpEarned, totalSeconds);

    // Show XP toast
    addToast({
      message: `+${formatXP(xpEarned)} XP earned for ${xpResult.skillName}!`,
      type: "success",
    });

    // Show level-up toast if skill leveled up
    if (xpResult.leveledUp) {
      addToast({
        message: `${xpResult.skillName} is now Level ${xpResult.newLevel}!`,
        type: "levelup",
        duration: 6000,
      });
    }

    // Handle recovery quest progress if debuffed
    if (isDebuffed) {
      // Check if any single pause exceeded 5 minutes
      // Note: totalPauseSeconds accumulates all pauses, but we need to check individual pauses
      // For simplicity, we check if the session had any excessive pause by using the timer state
      const pauseExceeded = isPauseExceeded(sessionPause);

      const recoveryResult = updateRecoveryProgress(totalSeconds, pauseExceeded);
      setRecoveryAccumulated(recoveryResult.accumulatedSeconds);

      if (pauseExceeded) {
        addToast({
          message: "Recovery progress reset due to extended pause",
          type: "warning",
        });
      } else if (recoveryResult.isComplete) {
        // Recovery complete - remove debuff and restore health
        await setDebuffed(false);
        await updateHealth(HEALTH_CONFIG.recoveryHealth);

        addToast({
          message: "Recovery Complete! Weakened status removed, health restored to 50!",
          type: "success",
        });
      }
    }

    // Reset pending skill
    setPendingSkillId(null);
  }, [stop, player, isDebuffed, addXPToSkill, addToast, setDebuffed, updateHealth]);

  // Handle manual time entry
  const handleManualLog = useCallback(
    async (hours: number, minutes: number) => {
      if (!pendingSkillId || !player) return;

      const totalSeconds = hours * 3600 + minutes * 60;

      // Create time log entry and get XP earned
      const { xpEarned } = await logTime(
        pendingSkillId,
        totalSeconds,
        "manual",
        player.currentStreak,
        player.isDebuffed
      );

      // Award XP to skill
      const xpResult = await addXPToSkill(pendingSkillId, xpEarned, totalSeconds);

      // Show toast
      addToast({
        message: `+${formatXP(xpEarned)} XP logged for ${xpResult.skillName}!`,
        type: "success",
      });

      // Show level-up toast if skill leveled up
      if (xpResult.leveledUp) {
        addToast({
          message: `${xpResult.skillName} is now Level ${xpResult.newLevel}!`,
          type: "levelup",
          duration: 6000,
        });
      }

      // Note: Manual time entry doesn't count toward recovery quest
      // Recovery requires timer usage to track consecutive hours
    },
    [pendingSkillId, player, addXPToSkill, addToast]
  );

  // Determine which skill ID to show in selector
  const displaySkillId = isRunning ? skillId : pendingSkillId;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-[var(--text-h1)] font-bold mb-6 uppercase tracking-wider">
        Time Tracker
      </h1>

      {/* Recovery Quest Banner - show when player is debuffed */}
      {isDebuffed && (
        <RecoveryQuestBanner
          accumulatedSeconds={recoveryAccumulated + (isRunning ? elapsedSeconds : 0)}
          isTimerRunning={isRunning}
          isPaused={isPaused}
          currentPauseDuration={currentPauseDuration}
        />
      )}

      <div className="glass-panel p-8">
        {/* Skill Selector */}
        <div className="flex justify-center mb-8">
          <SkillSelector
            selectedSkillId={displaySkillId}
            onSelect={handleSkillSelect}
            disabled={isRunning}
          />
        </div>

        {/* Timer Display */}
        <div className="mb-8">
          <TimerDisplay
            formattedTime={formattedTime}
            isRunning={isRunning}
            isPaused={isPaused}
            skillColor={skillColor}
          />
        </div>

        {/* Timer Controls */}
        <TimerControls
          isRunning={isRunning}
          isPaused={isPaused}
          canStart={!!pendingSkillId}
          onStart={handleStart}
          onPause={pause}
          onResume={resume}
          onStop={handleStop}
        />

        {/* Session info */}
        {isRunning && (
          <div className="mt-6 pt-6 border-t border-[var(--sl-border-subtle)] text-center">
            <p className="text-[var(--text-small)] text-[var(--sl-text-secondary)]">
              Tracking: <span className="text-[var(--sl-text-primary)]">{selectedSkill?.name}</span>
            </p>
            {player && (
              <p className="text-[var(--text-xs)] text-[var(--sl-text-muted)] mt-1">
                {streakMultiplier > 1 && (
                  <span className="text-[var(--sl-warning)]">
                    {streakMultiplier}x streak bonus active
                  </span>
                )}
                {player.isDebuffed && (
                  <span className="text-[var(--sl-danger)] ml-2">
                    (0.5x debuff penalty)
                  </span>
                )}
              </p>
            )}
          </div>
        )}

        {/* XP Preview */}
        {isRunning && elapsedSeconds > 0 && (
          <div className="mt-4 text-center">
            <p className="text-[var(--text-xs)] text-[var(--sl-text-muted)]">
              Current session:{" "}
              <span className="text-[var(--sl-blue-ice)]">
                ~{formatXP(
                  Math.floor(
                    secondsToHours(elapsedSeconds) *
                      TIME_XP_RATE *
                      streakMultiplier *
                      (player?.isDebuffed ? DEBUFF_MULTIPLIER : 1)
                  )
                )}{" "}
                XP
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Manual Time Entry - only show when timer is not running */}
      {!isRunning && (
        <ManualTimeEntry
          selectedSkillId={pendingSkillId}
          onLogTime={handleManualLog}
          disabled={false}
        />
      )}
    </div>
  );
}
