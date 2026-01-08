// src/lib/initialData.ts
// Initial hardcoded data for MVP

import type { Skill } from "@/types";

type InitialSkill = Omit<
  Skill,
  "level" | "progress" | "totalHours" | "createdAt" | "updatedAt"
>;

export const INITIAL_SKILLS: InitialSkill[] = [
  {
    id: "ai-engineering",
    name: "AI Engineering",
    icon: "\u{1F916}", // 🤖
    color: "#8B5CF6",
    totalXP: 0,
    totalSeconds: 0,
    displayOrder: 1,
    isActive: true,
  },
  {
    id: "fullstack-dev",
    name: "Full-Stack Development",
    icon: "\u{1F4BB}", // 💻
    color: "#3B82F6",
    totalXP: 0,
    totalSeconds: 0,
    displayOrder: 2,
    isActive: true,
  },
  {
    id: "product-design",
    name: "Product Design",
    icon: "\u{1F3A8}", // 🎨
    color: "#EC4899",
    totalXP: 0,
    totalSeconds: 0,
    displayOrder: 3,
    isActive: true,
  },
  {
    id: "physical-conditioning",
    name: "Physical Conditioning",
    icon: "\u{1F4AA}", // 💪
    color: "#10B981",
    totalXP: 0,
    totalSeconds: 0,
    displayOrder: 4,
    isActive: true,
  },
  {
    id: "job-hunting",
    name: "Job Hunting",
    icon: "\u{1F3AF}", // 🎯
    color: "#F59E0B",
    totalXP: 0,
    totalSeconds: 0,
    displayOrder: 5,
    isActive: true,
  },
  {
    id: "software-engineering",
    name: "Software Engineering",
    icon: "\u{2699}\u{FE0F}", // ⚙️
    color: "#6366F1",
    totalXP: 0,
    totalSeconds: 0,
    displayOrder: 6,
    isActive: true,
  },
];
