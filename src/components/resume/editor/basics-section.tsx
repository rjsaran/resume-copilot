"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/entry-editor/section-card";
import type { ResumeBasics } from "@/types/resume";

interface BasicsSectionProps {
  value: ResumeBasics;
  onChange: (value: ResumeBasics) => void;
}

/** No hide toggle here, unlike the other sections - there's no meaningful "hidden contact info" on a resume. */
export function BasicsSection({ value, onChange }: BasicsSectionProps) {
  return (
    <SectionCard
      title="Basics"
      description="Name, contact details, and professional summary."
      collapsible
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Name</Label>
          <Input
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Title</Label>
          <Input
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Email</Label>
          <Input
            value={value.email}
            onChange={(e) => onChange({ ...value, email: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Phone</Label>
          <Input
            value={value.phone}
            onChange={(e) => onChange({ ...value, phone: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Location</Label>
          <Input
            value={value.location ?? ""}
            onChange={(e) => onChange({ ...value, location: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>LinkedIn</Label>
          <Input
            value={value.linkedin ?? ""}
            onChange={(e) => onChange({ ...value, linkedin: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>GitHub</Label>
          <Input
            value={value.github ?? ""}
            onChange={(e) => onChange({ ...value, github: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Portfolio</Label>
          <Input
            value={value.portfolio ?? ""}
            onChange={(e) => onChange({ ...value, portfolio: e.target.value })}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Summary</Label>
        <Textarea
          className="min-h-24 text-sm"
          value={value.summary}
          onChange={(e) => onChange({ ...value, summary: e.target.value })}
        />
      </div>
    </SectionCard>
  );
}
