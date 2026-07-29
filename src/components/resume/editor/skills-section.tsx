"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/entry-editor/section-card";
import type { SkillsData } from "@/types/resume";

interface SkillsSectionProps {
  value: SkillsData;
  onChange: (value: SkillsData) => void;
  sectionHidden: boolean;
  onToggleSectionHidden: () => void;
}

const SKILL_CATEGORIES: Array<{ key: keyof SkillsData; label: string }> = [
  { key: "languages", label: "Languages" },
  { key: "frameworks", label: "Frameworks" },
  { key: "cloud", label: "Cloud" },
  { key: "databases", label: "Databases" },
  { key: "tools", label: "Tools" },
  { key: "other", label: "Other" },
];

function csvToArray(text: string): string[] {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function arrayToCsv(arr: string[] | undefined): string {
  return (arr ?? []).join(", ");
}

/** Fixed set of categories, unlike the knowledge base's freeform TechnologyCategory list - no per-item add/remove/reorder here, just a whole-section hide toggle. */
export function SkillsSection({
  value,
  onChange,
  sectionHidden,
  onToggleSectionHidden,
}: SkillsSectionProps) {
  return (
    <SectionCard
      title="Skills"
      collapsible
      hidden={sectionHidden}
      onToggleHidden={onToggleSectionHidden}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {SKILL_CATEGORIES.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <Label>{label} (comma-separated)</Label>
            <Input
              value={arrayToCsv(value[key])}
              onChange={(e) => onChange({ ...value, [key]: csvToArray(e.target.value) })}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
