"use client";

import { Plus, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { PersonalInfo } from "@/types/careerKnowledgeBase";

interface PersonalInfoSectionProps {
  value: PersonalInfo;
  onChange: (value: PersonalInfo) => void;
}

export function PersonalInfoSection({ value, onChange }: PersonalInfoSectionProps) {
  const links = value.links ?? [];

  function updateLink(index: number, patch: Partial<{ label: string; url: string }>) {
    onChange({
      ...value,
      links: links.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    });
  }

  function removeLink(index: number) {
    onChange({ ...value, links: links.filter((_, i) => i !== index) });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Info</CardTitle>
        <CardDescription>Name, contact details, and professional summary.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kb-full-name">Full name</Label>
            <Input
              id="kb-full-name"
              value={value.fullName}
              onChange={(e) => onChange({ ...value, fullName: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kb-headline">Headline</Label>
            <Input
              id="kb-headline"
              placeholder="e.g. Senior Software Engineer"
              value={value.headline}
              onChange={(e) => onChange({ ...value, headline: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kb-email">Email</Label>
            <Input
              id="kb-email"
              type="email"
              value={value.email}
              onChange={(e) => onChange({ ...value, email: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kb-phone">Phone</Label>
            <Input
              id="kb-phone"
              value={value.phone ?? ""}
              onChange={(e) => onChange({ ...value, phone: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="kb-location">Location</Label>
            <Input
              id="kb-location"
              value={value.location ?? ""}
              onChange={(e) => onChange({ ...value, location: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="kb-summary">Summary</Label>
          <Textarea
            id="kb-summary"
            className="min-h-24 text-sm"
            value={value.summary ?? ""}
            onChange={(e) => onChange({ ...value, summary: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Links</Label>
          {links.length > 0 && (
            <div className="flex flex-col gap-2">
              {links.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Label (e.g. GitHub)"
                    className="w-40"
                    value={link.label}
                    onChange={(e) => updateLink(i, { label: e.target.value })}
                  />
                  <Input
                    placeholder="https://..."
                    value={link.url}
                    onChange={(e) => updateLink(i, { url: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeLink(i)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => onChange({ ...value, links: [...links, { label: "", url: "" }] })}
          >
            <Plus className="size-3.5" />
            Add link
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
