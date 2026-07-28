"use client";

import { Plus, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StringListField } from "@/components/knowledge-base/string-list-field";
import type { TechnologyCategory } from "@/types/careerKnowledgeBase";

interface TechnologiesSectionProps {
  value: TechnologyCategory[];
  onChange: (value: TechnologyCategory[]) => void;
}

export function TechnologiesSection({ value, onChange }: TechnologiesSectionProps) {
  function updateAt(index: number, patch: Partial<TechnologyCategory>) {
    onChange(value.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Technologies</CardTitle>
        <CardDescription>Skills grouped into categories (e.g. Languages, Cloud, Databases).</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {value.map((entry, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <Input
                className="flex-1"
                placeholder="Category (e.g. Languages)"
                value={entry.category}
                onChange={(e) => updateAt(i, { category: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeAt(i)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
            <StringListField
              label="Items"
              values={entry.items}
              onChange={(items) => updateAt(i, { items })}
              placeholder="e.g. TypeScript"
              addLabel="Add item"
            />
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => onChange([...value, { category: "", items: [] }])}
        >
          <Plus className="size-3.5" />
          Add category
        </Button>
      </CardContent>
    </Card>
  );
}
