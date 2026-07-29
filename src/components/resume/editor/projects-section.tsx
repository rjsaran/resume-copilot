"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/entry-editor/section-card";
import { EntryCard } from "@/components/entry-editor/entry-card";
import { EntryList } from "@/components/entry-editor/entry-list";
import { StringListField } from "@/components/entry-editor/string-list-field";
import type { ProjectEntry } from "@/types/resume";

interface ProjectsSectionProps {
  value: ProjectEntry[];
  onChange: (value: ProjectEntry[]) => void;
  sectionHidden: boolean;
  onToggleSectionHidden: () => void;
}

function newProject(): ProjectEntry {
  return { name: "", bullets: [] };
}

export function ProjectsSection({
  value,
  onChange,
  sectionHidden,
  onToggleSectionHidden,
}: ProjectsSectionProps) {
  function updateAt(index: number, patch: Partial<ProjectEntry>) {
    onChange(value.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <SectionCard
      title="Projects"
      collapsible
      hidden={sectionHidden}
      onToggleHidden={onToggleSectionHidden}
    >
      <EntryList
        items={value}
        onAdd={() => onChange([...value, newProject()])}
        addLabel="Add project"
        reorderable
        onReorder={onChange}
        renderItem={(entry, i, dragHandleProps) => (
          <EntryCard
            title={entry.name || "New project"}
            subtitle={entry.location}
            defaultOpen={!entry.name}
            hidden={entry.hidden}
            onToggleHidden={() => updateAt(i, { hidden: !entry.hidden })}
            onRemove={() => removeAt(i)}
            dragHandleProps={dragHandleProps}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Name</Label>
                <Input
                  value={entry.name}
                  onChange={(e) => updateAt(i, { name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Link</Label>
                <Input
                  value={entry.link ?? ""}
                  onChange={(e) => updateAt(i, { link: e.target.value })}
                />
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
              placeholder="e.g. Next.js"
              addLabel="Add technology"
            />
          </EntryCard>
        )}
      />
    </SectionCard>
  );
}
