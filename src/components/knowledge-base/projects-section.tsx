"use client";

import { Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EntryCard } from "@/components/knowledge-base/entry-card";
import { StringListField } from "@/components/knowledge-base/string-list-field";
import type { ProjectKnowledge } from "@/types/careerKnowledgeBase";

interface ProjectsSectionProps {
  value: ProjectKnowledge[];
  onChange: (value: ProjectKnowledge[]) => void;
}

const PROJECT_TYPE_LABELS: Record<ProjectKnowledge["type"], string> = {
  personal: "Personal",
  professional: "Professional",
  "open-source": "Open Source",
};

function newProject(): ProjectKnowledge {
  return {
    id: crypto.randomUUID(),
    name: "",
    type: "personal",
    description: "",
    highlights: [],
  };
}

export function ProjectsSection({ value, onChange }: ProjectsSectionProps) {
  function updateAt(index: number, patch: Partial<ProjectKnowledge>) {
    onChange(value.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects</CardTitle>
        <CardDescription>Personal, professional, and open-source projects.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {value.map((entry, i) => (
          <EntryCard
            key={entry.id}
            title={entry.name || "New project"}
            subtitle={PROJECT_TYPE_LABELS[entry.type]}
            defaultOpen={!entry.name}
            onRemove={() => removeAt(i)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Name</Label>
                <Input value={entry.name} onChange={(e) => updateAt(i, { name: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select
                  value={entry.type}
                  onValueChange={(type) => type && updateAt(i, { type })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: ProjectKnowledge["type"]) => PROJECT_TYPE_LABELS[v]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PROJECT_TYPE_LABELS) as ProjectKnowledge["type"][]).map((type) => (
                      <SelectItem key={type} value={type}>
                        {PROJECT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Role</Label>
                <Input
                  value={entry.role ?? ""}
                  onChange={(e) => updateAt(i, { role: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>URL</Label>
                <Input
                  placeholder="https://..."
                  value={entry.url ?? ""}
                  onChange={(e) => updateAt(i, { url: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:col-span-2">
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
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Description</Label>
              <Textarea
                className="min-h-16 text-sm"
                value={entry.description}
                onChange={(e) => updateAt(i, { description: e.target.value })}
              />
            </div>

            <StringListField
              label="Highlights"
              values={entry.highlights}
              onChange={(highlights) => updateAt(i, { highlights })}
              placeholder="One fact per highlight"
              multiline
              addLabel="Add highlight"
            />

            <StringListField
              label="Technologies"
              values={entry.technologies ?? []}
              onChange={(technologies) => updateAt(i, { technologies })}
              placeholder="e.g. Next.js"
              addLabel="Add technology"
            />
          </EntryCard>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => onChange([...value, newProject()])}
        >
          <Plus className="size-3.5" />
          Add project
        </Button>
      </CardContent>
    </Card>
  );
}
