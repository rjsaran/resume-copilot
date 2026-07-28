"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { CoverLetterData } from "@/types/coverLetter";

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function CoverLetterEditor({
  coverLetter,
  onChange,
}: {
  coverLetter: CoverLetterData;
  onChange: (next: CoverLetterData) => void;
}) {
  function updateBasics(patch: Partial<CoverLetterData["basics"]>) {
    onChange({ ...coverLetter, basics: { ...coverLetter.basics, ...patch } });
  }

  function updateRecipient(patch: Partial<CoverLetterData["recipient"]>) {
    onChange({
      ...coverLetter,
      recipient: { ...coverLetter.recipient, ...patch },
    });
  }

  function updateParagraph(index: number, value: string) {
    const next = coverLetter.paragraphs.slice();
    next[index] = value;
    onChange({ ...coverLetter, paragraphs: next });
  }
  function addParagraph() {
    onChange({
      ...coverLetter,
      paragraphs: [...coverLetter.paragraphs, ""],
    });
  }
  function removeParagraph(index: number) {
    onChange({
      ...coverLetter,
      paragraphs: coverLetter.paragraphs.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="flex flex-col gap-6 text-sm">
      <section className="flex flex-col gap-3">
        <h3 className="font-semibold">Basics</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <Input
              value={coverLetter.basics.name}
              onChange={(e) => updateBasics({ name: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input
              value={coverLetter.basics.email}
              onChange={(e) => updateBasics({ email: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <Input
              value={coverLetter.basics.phone}
              onChange={(e) => updateBasics({ phone: e.target.value })}
            />
          </Field>
          <Field label="Location">
            <Input
              value={coverLetter.basics.location ?? ""}
              onChange={(e) => updateBasics({ location: e.target.value })}
            />
          </Field>
          <Field label="LinkedIn">
            <Input
              value={coverLetter.basics.linkedin ?? ""}
              onChange={(e) => updateBasics({ linkedin: e.target.value })}
            />
          </Field>
          <Field label="Portfolio">
            <Input
              value={coverLetter.basics.portfolio ?? ""}
              onChange={(e) => updateBasics({ portfolio: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Date">
          <Input
            value={coverLetter.date}
            onChange={(e) => onChange({ ...coverLetter, date: e.target.value })}
          />
        </Field>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h3 className="font-semibold">Recipient</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Hiring manager (optional)">
            <Input
              value={coverLetter.recipient.hiringManager ?? ""}
              onChange={(e) => updateRecipient({ hiringManager: e.target.value })}
            />
          </Field>
          <Field label="Company">
            <Input
              value={coverLetter.recipient.company}
              onChange={(e) => updateRecipient({ company: e.target.value })}
            />
          </Field>
          <Field label="Job title" className="sm:col-span-2">
            <Input
              value={coverLetter.recipient.jobTitle}
              onChange={(e) => updateRecipient({ jobTitle: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Salutation">
          <Input
            value={coverLetter.salutation}
            onChange={(e) =>
              onChange({ ...coverLetter, salutation: e.target.value })
            }
          />
        </Field>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Body paragraphs</h3>
          <Button type="button" size="sm" variant="outline" onClick={addParagraph}>
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
        {coverLetter.paragraphs.map((paragraph, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Paragraph {i + 1}
              </Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeParagraph(i)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            <Textarea
              rows={4}
              value={paragraph}
              onChange={(e) => updateParagraph(i, e.target.value)}
            />
          </div>
        ))}
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h3 className="font-semibold">Closing</h3>
        <Field label='Closing line (e.g. "Sincerely,")'>
          <Input
            value={coverLetter.closing}
            onChange={(e) =>
              onChange({ ...coverLetter, closing: e.target.value })
            }
          />
        </Field>
      </section>
    </div>
  );
}
