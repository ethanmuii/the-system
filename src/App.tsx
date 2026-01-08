import { useEffect, useState, useCallback } from "react";
import { TitleBar } from "@/components/common/TitleBar";
import { Dashboard } from "@/components/Dashboard";
import { initializeDatabase } from "@/lib/initDatabase";
import { usePlayerStore } from "@/stores/playerStore";
import { useSkillsStore } from "@/stores/skillsStore";

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

function App(): JSX.Element {
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayer = usePlayerStore((state) => state.fetchPlayer);
  const fetchSkills = useSkillsStore((state) => state.fetchSkills);

  const initialize = useCallback(async (): Promise<void> => {
    setInitializing(true);
    setError(null);

    try {
      console.log("Step 1: Initializing database...");
      await initializeDatabase();
      console.log("Step 2: Database initialized, fetching data...");

      // Fetch initial data
      await Promise.all([fetchPlayer(), fetchSkills()]);
      console.log("Step 3: Data fetched successfully");
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
  }, [fetchPlayer, fetchSkills]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="app-window min-h-screen flex flex-col">
      {/* Custom title bar */}
      <TitleBar />

      {/* Main content area */}
      <main className="flex-1 p-6 overflow-auto">
        {initializing ? (
          <LoadingScreen />
        ) : error ? (
          <ErrorScreen message={error} onRetry={initialize} />
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  );
}

export default App;
