// src/components/common/TitleBar.tsx
// Subtle drag region at top of window with floating window controls

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
      className="drag-region h-[28px] min-h-[28px] max-h-[28px] shrink-0 flex items-center justify-end select-none"
    >
      {/* Window controls - positioned at right edge */}
      <div className="flex h-[28px]">
        {/* Minimize to taskbar button */}
        <button
          onClick={handleMinimize}
          className="h-[28px] w-[36px] hover:bg-white/10 transition-colors flex items-center justify-center group"
          aria-label="Minimize"
          title="Minimize"
        >
          <Minus
            size={12}
            className="text-sl-text-secondary group-hover:text-sl-text-primary"
          />
        </button>

        {/* Maximize/Restore toggle button */}
        <button
          onClick={handleToggleMaximize}
          className="h-[28px] w-[36px] hover:bg-white/10 transition-colors flex items-center justify-center group"
          aria-label={isMaximized ? "Restore" : "Maximize"}
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <Copy
              size={10}
              className="text-sl-text-secondary group-hover:text-sl-text-primary rotate-90"
            />
          ) : (
            <Square
              size={10}
              className="text-sl-text-secondary group-hover:text-sl-text-primary"
            />
          )}
        </button>

        {/* Close to tray button */}
        <button
          onClick={handleClose}
          className="h-[28px] w-[36px] hover:bg-red-500/80 transition-colors flex items-center justify-center group"
          aria-label="Close"
          title="Close to tray"
        >
          <X
            size={12}
            className="text-sl-text-secondary group-hover:text-white"
          />
        </button>
      </div>
    </div>
  );
}
