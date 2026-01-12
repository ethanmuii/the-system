// src/components/common/TitleBar.tsx
// Custom window title bar for frameless window with standard Windows behavior

import { Window } from "@tauri-apps/api/window";
import { Minus, Square, Copy, X } from "lucide-react";
import { useState, useEffect } from "react";

const appWindow = new Window("main");

export function TitleBar(): JSX.Element {
  const [isMaximized, setIsMaximized] = useState(false);

  // Track maximized state
  useEffect(() => {
    const checkMaximized = async (): Promise<void> => {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    };

    checkMaximized();

    // Listen for resize events to detect maximize changes
    const unlisten = appWindow.onResized(() => {
      checkMaximized();
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // Minimize to taskbar (standard Windows minimize)
  const handleMinimize = async (): Promise<void> => {
    await appWindow.minimize();
  };

  // Toggle maximized/normal window state
  const handleToggleMaximize = async (): Promise<void> => {
    await appWindow.toggleMaximize();
  };

  // Close window to tray (app keeps running in background)
  const handleClose = async (): Promise<void> => {
    await appWindow.hide();
  };

  return (
    <div
      data-tauri-drag-region
      className="glass-panel h-10 flex items-center justify-between select-none"
    >
      {/* App title */}
      <div data-tauri-drag-region className="flex items-center gap-2 px-4">
        <span className="text-sm font-semibold tracking-wider text-sl-text-secondary uppercase">
          ARISE
        </span>
      </div>

      {/* Window controls */}
      <div className="flex h-full">
        {/* Minimize to taskbar button */}
        <button
          onClick={handleMinimize}
          className="h-full px-4 hover:bg-white/10 transition-colors flex items-center justify-center group"
          aria-label="Minimize"
          title="Minimize"
        >
          <Minus
            size={16}
            className="text-sl-text-secondary group-hover:text-sl-text-primary"
          />
        </button>

        {/* Maximize/Restore toggle button */}
        <button
          onClick={handleToggleMaximize}
          className="h-full px-4 hover:bg-white/10 transition-colors flex items-center justify-center group"
          aria-label={isMaximized ? "Restore" : "Maximize"}
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <Copy
              size={14}
              className="text-sl-text-secondary group-hover:text-sl-text-primary rotate-90"
            />
          ) : (
            <Square
              size={14}
              className="text-sl-text-secondary group-hover:text-sl-text-primary"
            />
          )}
        </button>

        {/* Close to tray button */}
        <button
          onClick={handleClose}
          className="h-full px-4 hover:bg-red-500/80 transition-colors flex items-center justify-center group"
          aria-label="Close"
          title="Close to tray"
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
