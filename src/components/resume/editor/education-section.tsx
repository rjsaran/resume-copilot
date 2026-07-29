"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/entry-editor/section-card";
import { EntryCard } from "@/components/entry-editor/entry-card";
import { EntryList } from "@/components/entry-editor/entry-list";
import { StringListField } from "@/components/entry-editor/string-list-field";
import type { EducationEntry } from "@/types/resume";

interface EducationSectionProps {
  value: EducationEntry[];
  onChange: (value: EducationEntry[]) => void;
  sectionHidden: boolean;
  onToggleSectionHidden: () => void;
}

function newEducation(): EducationEntry {
  return { institution: "", degree: "" };
}

export function EducationSection({
  value,
  onChange,
  sectionHidden,
  onToggleSectionHidden,
}: EducationSectionProps) {
  function updateAt(index: number, patch: Partial<EducationEntry>) {
    onChange(value.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <SectionCard
      title="Education"
      collapsible
      hidden={sectionHidden}
      onToggleHidden={onToggleSectionHidden}
    >
      <EntryList
        items={value}
        onAdd={() => onChange([...value, newEducation()])}
        addLabel="Add education"
        renderItem={(entry, i) => (
          <EntryCard
            title={entry.degree || "New education"}
            subtitle={entry.institution}
            defaultOpen={!entry.institution && !entry.degree}
            hidden={entry.hidden}
            onToggleHidden={() => updateAt(i, { hidden: !entry.hidden })}
            onRemove={() => removeAt(i)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Institution</Label>
                <Input
                  value={entry.institution}
                  onChange={(e) => updateAt(i, { institution: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Degree</Label>
                <Input
                  value={entry.degree}
                  onChange={(e) => updateAt(i, { degree: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Location</Label>
                <Input
                  value={entry.location ?? ""}
                  onChange={(e) => updateAt(i, { location: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>GPA</Label>
                <Input
                  value={entry.gpa ?? ""}
                  onChange={(e) => updateAt(i, { gpa: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Start date</Label>
                <Input
                  value={entry.startDate ?? ""}
                  onChange={(e) => updateAt(i, { startDate: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>End date</Label>
                <Input
                  value={entry.endDate ?? ""}
                  onChange={(e) => updateAt(i, { endDate: e.target.value })}
                />
              </div>
            </div>

            <StringListField
              label="Notes"
              values={entry.notes ?? []}
              onChange={(notes) => updateAt(i, { notes })}
              placeholder="e.g. Relevant coursework, honors"
              multiline
              addLabel="Add note"
            />
          </EntryCard>
        )}
      />
    </SectionCard>
  );
}
