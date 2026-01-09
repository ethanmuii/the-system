// src/components/Timer/SkillSelector.tsx
// Dropdown to select skill for time tracking

import { useSkills } from "@/hooks/useSkills";

interface SkillSelectorProps {
  selectedSkillId: string | null;
  onSelect: (skillId: string) => void;
  disabled?: boolean;
}

export function SkillSelector({
  selectedSkillId,
  onSelect,
  disabled = false,
}: SkillSelectorProps): JSX.Element {
  const { activeSkills } = useSkills();

  return (
    <div className="w-full max-w-sm">
      <label className="block text-[var(--text-xs)] uppercase tracking-wider text-[var(--sl-text-secondary)] mb-2">
        Tracking
      </label>
      <select
        value={selectedSkillId ?? ""}
        onChange={(e) => onSelect(e.target.value)}
        disabled={disabled}
        className="glass-panel w-full p-3 text-[var(--text-body)] bg-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-[var(--sl-border-bright)]"
      >
        <option value="" disabled className="bg-[var(--sl-bg-dark)]">
          Select a skill...
        </option>
        {activeSkills.map((skill) => (
          <option
            key={skill.id}
            value={skill.id}
            className="bg-[var(--sl-bg-dark)]"
          >
            {skill.icon} {skill.name}
          </option>
        ))}
      </select>
    </div>
  );
}
