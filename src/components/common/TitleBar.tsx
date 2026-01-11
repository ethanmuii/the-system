// src/components/common/TitleBar.tsx
// Custom window title bar for frameless window with tray integration

import { Window } from "@tauri-apps/api/window";
import { Minus, Maximize2, Minimize2, X } from "lucide-react";
import { useState, useEffect } from "react";

const appWindow = new Window("main");

export function TitleBar(): JSX.Element {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track fullscreen state
  useEffect(() => {
    const checkFullscreen = async (): Promise<void> => {
      const fullscreen = await appWindow.isFullscreen();
      setIsFullscreen(fullscreen);
    };

    checkFullscreen();

    // Listen for resize events to detect fullscreen changes
    const unlisten = appWindow.onResized(() => {
      checkFullscreen();
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // Minimize to tray (hide window, app stays running)
  const handleMinimizeToTray = async (): Promise<void> => {
    await appWindow.hide();
  };

  // Toggle fullscreen mode
  const handleToggleFullscreen = async (): Promise<void> => {
    const fullscreen = await appWindow.isFullscreen();
    await appWindow.setFullscreen(!fullscreen);
    setIsFullscreen(!fullscreen);
  };

  // Quit the application entirely
  const handleQuit = async (): Promise<void> => {
    await appWindow.close();
  };

  return (
    <div
      data-tauri-drag-region
      className="h-10 flex items-center justify-between select-none bg-sl-bg-dark/50 border-b border-sl-border-subtle"
    >
      {/* App title */}
      <div data-tauri-drag-region className="flex items-center gap-2 px-4">
        <span className="text-sm font-semibold tracking-wider text-sl-text-secondary uppercase">
          ARISE
        </span>
      </div>

      {/* Window controls */}
      <div className="flex h-full">
        {/* Minimize to tray button */}
        <button
          onClick={handleMinimizeToTray}
          className="h-full px-4 hover:bg-white/10 transition-colors flex items-center justify-center group"
          aria-label="Minimize to tray"
          title="Minimize to tray (Ctrl+Shift+A to restore)"
        >
          <Minus
            size={16}
            className="text-sl-text-secondary group-hover:text-sl-text-primary"
          />
        </button>

        {/* Fullscreen toggle button */}
        <button
          onClick={handleToggleFullscreen}
          className="h-full px-4 hover:bg-white/10 transition-colors flex items-center justify-center group"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2
              size={14}
              className="text-sl-text-secondary group-hover:text-sl-text-primary"
            />
          ) : (
            <Maximize2
              size={14}
              className="text-sl-text-secondary group-hover:text-sl-text-primary"
            />
          )}
        </button>

        {/* Quit button */}
        <button
          onClick={handleQuit}
          className="h-full px-4 hover:bg-red-500/80 transition-colors flex items-center justify-center group"
          aria-label="Quit application"
          title="Quit application"
        >
          <X
            size={16}
            className="text-sl-text-secondary group-hover:text-white"
          />
        </button>
      </div>
    </div>
  );
}
