"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/entry-editor/section-card";
import { EntryCard } from "@/components/entry-editor/entry-card";
import { EntryList } from "@/components/entry-editor/entry-list";
import { StringListField } from "@/components/entry-editor/string-list-field";
import type { ExperienceEntry } from "@/types/resume";

interface ExperienceSectionProps {
  value: ExperienceEntry[];
  onChange: (value: ExperienceEntry[]) => void;
  sectionHidden: boolean;
  onToggleSectionHidden: () => void;
}

function newExperience(): ExperienceEntry {
  return { company: "", role: "", startDate: "", endDate: "", bullets: [] };
}

export function ExperienceSection({
  value,
  onChange,
  sectionHidden,
  onToggleSectionHidden,
}: ExperienceSectionProps) {
  function updateAt(index: number, patch: Partial<ExperienceEntry>) {
    onChange(value.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <SectionCard
      title="Experience"
      collapsible
      hidden={sectionHidden}
      onToggleHidden={onToggleSectionHidden}
    >
      <EntryList
        items={value}
        onAdd={() => onChange([...value, newExperience()])}
        addLabel="Add experience"
        reorderable
        onReorder={onChange}
        renderItem={(entry, i, dragHandleProps) => (
          <EntryCard
            title={
              [entry.role, entry.company].filter(Boolean).join(" @ ") ||
              "New experience"
            }
            subtitle={[entry.startDate, entry.endDate].filter(Boolean).join(" – ")}
            defaultOpen={!entry.company && !entry.role}
            hidden={entry.hidden}
            onToggleHidden={() => updateAt(i, { hidden: !entry.hidden })}
            onRemove={() => removeAt(i)}
            dragHandleProps={dragHandleProps}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Company</Label>
                <Input
                  value={entry.company}
                  onChange={(e) => updateAt(i, { company: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Role</Label>
                <Input
                  value={entry.role}
                  onChange={(e) => updateAt(i, { role: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Location</Label>
                <Input
                  value={entry.location ?? ""}
                  onChange={(e) => updateAt(i, { location: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Start date</Label>
                  <Input
                    value={entry.startDate}
                    onChange={(e) => updateAt(i, { startDate: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>End date</Label>
                  <Input
                    value={entry.endDate}
                    onChange={(e) => updateAt(i, { endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <StringListField
              label="Bullets"
              values={entry.bullets}
              onChange={(bullets) => updateAt(i, { bullets })}
              placeholder="One accomplishment per bullet"
              multiline
              addLabel="Add bullet"
            />

            <StringListField
              label="Technologies"
              values={entry.technologies ?? []}
              onChange={(technologies) => updateAt(i, { technologies })}
              placeholder="e.g. TypeScript"
              addLabel="Add technology"
            />
          </EntryCard>
        )}
      />
    </SectionCard>
  );
}
