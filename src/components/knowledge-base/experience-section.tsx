"use client";

import { Plus } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EntryCard } from "@/components/knowledge-base/entry-card";
import { StringListField } from "@/components/knowledge-base/string-list-field";
import type { ExperienceKnowledge } from "@/types/careerKnowledgeBase";

interface ExperienceSectionProps {
  value: ExperienceKnowledge[];
  onChange: (value: ExperienceKnowledge[]) => void;
}

function newExperience(): ExperienceKnowledge {
  return {
    id: crypto.randomUUID(),
    company: "",
    role: "",
    startDate: "",
    achievements: [],
  };
}

export function ExperienceSection({ value, onChange }: ExperienceSectionProps) {
  function updateAt(index: number, patch: Partial<ExperienceKnowledge>) {
    onChange(value.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Experience</CardTitle>
        <CardDescription>
          Every role - the full history, not trimmed to resume length.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {value.map((entry, i) => (
          <EntryCard
            key={entry.id}
            title={
              [entry.role, entry.company].filter(Boolean).join(" @ ") ||
              "New experience"
            }
            subtitle={[entry.startDate, entry.endDate]
              .filter(Boolean)
              .join(" – ")}
            defaultOpen={!entry.company && !entry.role}
            onRemove={() => removeAt(i)}
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
                    placeholder="e.g. Jan 2021"
                    value={entry.startDate}
                    onChange={(e) => updateAt(i, { startDate: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>End date</Label>
                  <Input
                    placeholder="Present"
                    value={entry.endDate ?? ""}
                    onChange={(e) => updateAt(i, { endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Summary</Label>
              <Textarea
                className="min-h-16 text-sm"
                value={entry.summary ?? ""}
                onChange={(e) => updateAt(i, { summary: e.target.value })}
              />
            </div>

            <StringListField
              label="Achievements"
              values={entry.achievements}
              onChange={(achievements) => updateAt(i, { achievements })}
              placeholder="One fact per achievement"
              multiline
              addLabel="Add achievement"
            />

            <StringListField
              label="Technologies"
              values={entry.technologies ?? []}
              onChange={(technologies) => updateAt(i, { technologies })}
              placeholder="e.g. TypeScript"
              addLabel="Add technology"
            />
          </EntryCard>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => onChange([...value, newExperience()])}
        >
          <Plus className="size-3.5" />
          Add experience
        </Button>
      </CardContent>
    </Card>
  );
}
