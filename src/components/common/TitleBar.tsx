// src/components/common/TitleBar.tsx
// Custom window title bar for frameless window

import { Window } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";

const appWindow = new Window("main");

export function TitleBar(): JSX.Element {
  const handleMinimize = async (): Promise<void> => {
    await appWindow.minimize();
  };

  const handleMaximize = async (): Promise<void> => {
    const isMaximized = await appWindow.isMaximized();
    if (isMaximized) {
      await appWindow.unmaximize();
    } else {
      await appWindow.maximize();
    }
  };

  const handleClose = async (): Promise<void> => {
    await appWindow.close();
  };

  return (
    <div
      data-tauri-drag-region
      className="h-10 flex items-center justify-between select-none bg-sl-bg-dark/50 border-b border-sl-border-subtle"
    >
      {/* App title */}
      <div
        data-tauri-drag-region
        className="flex items-center gap-2 px-4"
      >
        <span className="text-sm font-semibold tracking-wider text-sl-text-secondary uppercase">
          ARISE
        </span>
      </div>

      {/* Window controls */}
      <div className="flex h-full">
        <button
          onClick={handleMinimize}
          className="h-full px-4 hover:bg-white/10 transition-colors flex items-center justify-center"
          aria-label="Minimize"
        >
          <Minus size={16} className="text-sl-text-secondary" />
        </button>
        <button
          onClick={handleMaximize}
          className="h-full px-4 hover:bg-white/10 transition-colors flex items-center justify-center"
          aria-label="Maximize"
        >
          <Square size={14} className="text-sl-text-secondary" />
        </button>
        <button
          onClick={handleClose}
          className="h-full px-4 hover:bg-red-500/80 transition-colors flex items-center justify-center"
          aria-label="Close"
        >
          <X size={16} className="text-sl-text-secondary" />
        </button>
      </div>
    </div>
  );
}
