import { useEffect, useState, useCallback, useRef } from "react";
import { TitleBar } from "@/components/common/TitleBar";
import { ToastContainer } from "@/components/common/Toast";
import { Navigation } from "@/components/Navigation";
import { Dashboard } from "@/components/Dashboard";
import { TimerView } from "@/components/Timer";
import { JournalView } from "@/components/Journal";
import { initializeDatabase } from "@/lib/initDatabase";
import { checkAndProcessNewDay, DailyResolutionResult } from "@/lib/dailyResolution";
import { usePlayerStore } from "@/stores/playerStore";
import { useSkillsStore } from "@/stores/skillsStore";
import { useQuestsStore } from "@/stores/questsStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { useToastStore } from "@/stores/toastStore";
import { usePlayer } from "@/hooks/usePlayer";
import { getStreakMultiplier } from "@/lib/xpCalculator";

function LoadingScreen(): JSX.Element {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-[var(--text-display)] font-bold level-display mb-4">
          ARISE
        </h1>
        <p className="text-[var(--sl-text-secondary)]">
          Initializing System...
        </p>
      </div>
    </div>
  );
}

interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
}

function ErrorScreen({ message, onRetry }: ErrorScreenProps): JSX.Element {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="glass-panel p-8 max-w-md text-center">
        <h2 className="text-[var(--text-h1)] font-bold text-[var(--sl-danger)] mb-4">
          System Error
        </h2>
        <p className="text-[var(--sl-text-secondary)] mb-6">{message}</p>
        <button onClick={onRetry} className="btn-primary">
          Retry
        </button>
      </div>
    </div>
  );
}

/**
 * Component that tracks overall level changes and fires toast notifications
 */
function OverallLevelTracker(): null {
  const { level } = usePlayer();
  const addToast = useToastStore((state) => state.addToast);
  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    // Skip the first render (when prevLevelRef is null)
    if (prevLevelRef.current !== null && level > prevLevelRef.current) {
      addToast({
        message: `You reached Overall Level ${level}!`,
        type: "levelup",
        duration: 6000,
      });
    }
    prevLevelRef.current = level;
  }, [level, addToast]);

  return null;
}

/**
 * Show daily resolution notifications
 */
function showDailyResolutionToasts(
  result: DailyResolutionResult,
  addToast: (toast: { message: string; type: "success" | "info" | "warning" | "error"; duration?: number }) => void
): void {
  if (!result.isNewDay) return;

  // Build the main summary message
  const parts: string[] = [];

  // Yesterday's results (if there were quests)
  if (result.questsTotal > 0) {
    parts.push(`Yesterday: ${result.questsCompleted}/${result.questsTotal} quests`);

    // Streak info
    if (result.streakChange === "increment") {
      const multiplier = getStreakMultiplier(result.newStreak);
      if (multiplier > 1) {
        parts.push(`Streak: ${result.newStreak} days (${multiplier}x bonus)`);
      } else {
        parts.push(`Streak: ${result.newStreak} days`);
      }
    } else if (result.streakChange === "reset") {
      parts.push("Streak reset");
    }

    // Health change
    if (result.healthChange > 0) {
      parts.push(`Health +${result.healthChange}`);
    } else if (result.healthChange < 0) {
      parts.push(`Health ${result.healthChange}`);
    }
  }

  // Today's quests
  if (result.questsGenerated > 0) {
    parts.push(`${result.questsGenerated} new quest${result.questsGenerated > 1 ? "s" : ""} for today`);
  }

  // Show the summary toast
  if (parts.length > 0) {
    const isSuccess = result.yesterdayComplete;
    addToast({
      message: parts.join(". ") + ".",
      type: isSuccess ? "info" : "warning",
      duration: 6000,
    });
  }

  // Show debuff warning if entered debuffed state
  if (result.enteredDebuff) {
    addToast({
      message: "Health depleted! You've entered Weakened state. Complete a Recovery Quest to restore.",
      type: "error",
      duration: 8000,
    });
  }
}

function App(): JSX.Element {
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyResolutionResult, setDailyResolutionResult] = useState<DailyResolutionResult | null>(null);

  const fetchPlayer = usePlayerStore((state) => state.fetchPlayer);
  const fetchSkills = useSkillsStore((state) => state.fetchSkills);
  const fetchQuests = useQuestsStore((state) => state.fetchQuests);
  const activeView = useNavigationStore((state) => state.activeView);
  const addToast = useToastStore((state) => state.addToast);

  const initialize = useCallback(async (): Promise<void> => {
    setInitializing(true);
    setError(null);

    try {
      console.log("Step 1: Initializing database...");
      await initializeDatabase();
      console.log("Step 2: Database initialized, processing daily resolution...");

      // Process daily resolution (generate recurring quests for today)
      const resolutionResult = await checkAndProcessNewDay();
      setDailyResolutionResult(resolutionResult);
      console.log("Step 3: Daily resolution complete, fetching data...");

      // Fetch initial data
      await Promise.all([fetchPlayer(), fetchSkills(), fetchQuests()]);
      console.log("Step 4: Data fetched successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? `${err.name}: ${err.message}`
          : "Failed to initialize";
      setError(errorMessage);
      console.error("Initialization failed:", err);
      // Log the full error stack for debugging
      if (err instanceof Error && err.stack) {
        console.error("Stack trace:", err.stack);
      }
    } finally {
      setInitializing(false);
    }
  }, [fetchPlayer, fetchSkills, fetchQuests]);

  // Show daily resolution toasts after initialization completes
  useEffect(() => {
    if (!initializing && dailyResolutionResult) {
      showDailyResolutionToasts(dailyResolutionResult, addToast);
      setDailyResolutionResult(null); // Clear after showing
    }
  }, [initializing, dailyResolutionResult, addToast]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="app-window min-h-screen flex flex-col">
      {/* Custom title bar */}
      <TitleBar />

      {/* Navigation tabs */}
      <Navigation />

      {/* Main content area */}
      <main className="flex-1 p-6 overflow-auto">
        {initializing ? (
          <LoadingScreen />
        ) : error ? (
          <ErrorScreen message={error} onRetry={initialize} />
        ) : (
          <>
            {activeView === "dashboard" && <Dashboard />}
            {activeView === "timer" && <TimerView />}
            {activeView === "journal" && <JournalView />}
            {/* Track overall level changes for notifications */}
            <OverallLevelTracker />
          </>
        )}
      </main>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}

export default App;
