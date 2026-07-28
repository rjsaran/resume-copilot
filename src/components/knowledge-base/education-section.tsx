"use client";

import { Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EntryCard } from "@/components/knowledge-base/entry-card";
import { StringListField } from "@/components/knowledge-base/string-list-field";
import type { EducationKnowledge } from "@/types/careerKnowledgeBase";

interface EducationSectionProps {
  value: EducationKnowledge[];
  onChange: (value: EducationKnowledge[]) => void;
}

function newEducation(): EducationKnowledge {
  return {
    id: crypto.randomUUID(),
    institution: "",
    degree: "",
  };
}

export function EducationSection({ value, onChange }: EducationSectionProps) {
  function updateAt(index: number, patch: Partial<EducationKnowledge>) {
    onChange(value.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Education</CardTitle>
        <CardDescription>Degrees, institutions, and coursework.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {value.map((entry, i) => (
          <EntryCard
            key={entry.id}
            title={entry.degree || "New education"}
            subtitle={entry.institution}
            defaultOpen={!entry.institution && !entry.degree}
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
                <Input value={entry.degree} onChange={(e) => updateAt(i, { degree: e.target.value })} />
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
                <Input value={entry.gpa ?? ""} onChange={(e) => updateAt(i, { gpa: e.target.value })} />
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
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => onChange([...value, newEducation()])}
        >
          <Plus className="size-3.5" />
          Add education
        </Button>
      </CardContent>
    </Card>
  );
}
