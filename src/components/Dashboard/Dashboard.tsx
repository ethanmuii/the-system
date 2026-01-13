// src/components/Dashboard/Dashboard.tsx
// Main dashboard layout combining player stats, skills grid, and quests

import { useSkills } from "@/hooks/useSkills";
import { PlayerStats } from "./PlayerStats";
import { SkillCard } from "@/components/Skills/SkillCard";
import { SkillModal } from "@/components/Skills/SkillModal";
import { QuestList } from "@/components/Quests";

export function Dashboard(): JSX.Element {
  const { activeSkills, selectedSkill, selectSkill, loading } = useSkills();

  if (loading) {
    return (
      <div className="flex flex-col py-8">
        <div className="space-y-8 lg:space-y-10">
          {/* Player Stats Skeleton */}
          <div className="glass-panel p-8 animate-pulse">
            <div className="h-8 bg-[var(--sl-bg-elevated)] rounded w-1/3 mb-4" />
            <div className="h-4 bg-[var(--sl-bg-elevated)] rounded w-full mb-4" />
            <div className="h-4 bg-[var(--sl-bg-elevated)] rounded w-2/3" />
          </div>

          {/* Skills Section Header Skeleton */}
          <div className="h-6 bg-[var(--sl-bg-elevated)] rounded w-24" />

          {/* Skills Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-panel p-6 lg:p-8 animate-pulse">
                <div className="h-6 bg-[var(--sl-bg-elevated)] rounded w-3/4 mb-3" />
                <div className="h-8 bg-[var(--sl-bg-elevated)] rounded w-1/4 mb-3" />
                <div className="h-2 bg-[var(--sl-bg-elevated)] rounded w-full mb-2" />
                <div className="h-3 bg-[var(--sl-bg-elevated)] rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col py-8">
      <div className="space-y-8 lg:space-y-10">
        {/* Player Stats Section */}
        <PlayerStats />

        {/* Skills Section */}
        <section>
          <h2 className="text-[var(--text-h1)] font-semibold uppercase tracking-wider text-[var(--sl-text-secondary)] mb-5">
            Skills
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {activeSkills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} onSelect={selectSkill} />
            ))}
          </div>
        </section>

        {/* Quests Section */}
        <QuestList />

        {/* Skill Modal */}
        <SkillModal skill={selectedSkill} onClose={() => selectSkill(null)} />
      </div>
    </div>
  );
}
