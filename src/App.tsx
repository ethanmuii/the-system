import { useEffect, useState, useCallback, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { TitleBar } from "@/components/common/TitleBar";
import { ToastContainer } from "@/components/common/Toast";
import { QuitConfirmDialog } from "@/components/common/QuitConfirmDialog";
import { RefreshConfirmDialog } from "@/components/common/RefreshConfirmDialog";
import { SwipeableViews } from "@/components/common/SwipeableViews";
import { NavArrow } from "@/components/common/NavArrow";
import { Dashboard } from "@/components/Dashboard";
import { TimerView, TimerManager, ActiveTimerIndicator } from "@/components/Timer";
import { JournalView } from "@/components/Journal";
import { initializeDatabase } from "@/lib/initDatabase";
import { checkAndProcessNewDay, DailyResolutionResult } from "@/lib/dailyResolution";
import { usePlayerStore } from "@/stores/playerStore";
import { useSkillsStore } from "@/stores/skillsStore";
import { useQuestsStore } from "@/stores/questsStore";
import { useNavigationStore, getAdjacentViews } from "@/stores/navigationStore";
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
  const navigateLeft = useNavigationStore((state) => state.navigateLeft);
  const navigateRight = useNavigationStore((state) => state.navigateRight);
  const addToast = useToastStore((state) => state.addToast);

  // Get adjacent views for showing/hiding arrows
  const { left: canGoLeft, right: canGoRight } = getAdjacentViews(activeView);

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

  // Listen for navigation events from system tray menu
  useEffect(() => {
    const unlisten = listen<string>("navigate-to-view", (event) => {
      const view = event.payload;
      if (view === "timer" || view === "dashboard" || view === "journal") {
        useNavigationStore.getState().setActiveView(view);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // Keyboard navigation with arrow keys
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      // Don't navigate if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      if (event.key === "ArrowLeft") {
        navigateLeft();
      } else if (event.key === "ArrowRight") {
        navigateRight();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigateLeft, navigateRight]);

  return (
    <div className="h-screen flex flex-col">
      {/* Drag region with window controls - outside padding, at very top */}
      <TitleBar />

      {/* Main content wrapper - relative positioning for nav arrows */}
      <div className="flex-1 min-h-0 relative">
        {/* Left navigation arrow - in left padding area */}
        {canGoLeft && (
          <NavArrow direction="left" onClick={navigateLeft} />
        )}

        {/* Right navigation arrow - in right padding area */}
        {canGoRight && (
          <NavArrow direction="right" onClick={navigateRight} />
        )}

        {/* App window with padding */}
        <div className="app-window h-full p-8 flex flex-col">
          {/* Main content area - swipeable views */}
          {initializing ? (
            <LoadingScreen />
          ) : error ? (
            <ErrorScreen message={error} onRetry={initialize} />
          ) : (
            <SwipeableViews>
              <JournalView />
              <Dashboard />
              <TimerView />
            </SwipeableViews>
          )}

          {/* Track overall level changes for notifications */}
          <OverallLevelTracker />

          {/* Toast notifications */}
          <ToastContainer />

          {/* Timer tick manager - runs at app root so timer continues across tab switches */}
          <TimerManager />

          {/* Floating timer indicator - shows when timer is running on other tabs */}
          <ActiveTimerIndicator />

          {/* Quit confirmation dialog - shows when trying to quit with active timer */}
          <QuitConfirmDialog />

          {/* Refresh confirmation dialog - shows when trying to refresh with active timer */}
          <RefreshConfirmDialog />
        </div>
      </div>
    </div>
  );
}

export default App;
