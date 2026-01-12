// src/components/Navigation/Navigation.tsx
// Tab navigation component for switching between views

import { LayoutDashboard, Timer, BookOpen } from "lucide-react";
import { useNavigationStore } from "@/stores/navigationStore";
import type { View } from "@/types";

interface NavTab {
  id: View;
  label: string;
  icon: React.ReactNode;
}

const tabs: NavTab[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { id: "timer", label: "Timer", icon: <Timer size={16} /> },
  { id: "journal", label: "Journal", icon: <BookOpen size={16} /> },
];

export function Navigation(): JSX.Element {
  const activeView = useNavigationStore((state) => state.activeView);
  const setActiveView = useNavigationStore((state) => state.setActiveView);

  return (
    <nav className="glass-panel">
      <div className="flex px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`nav-tab flex items-center gap-2 ${
              activeView === tab.id ? "active" : ""
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
