"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface StringListFieldProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  multiline?: boolean;
  addLabel?: string;
}

/**
 * Add/edit/remove list of plain strings. Multiline (achievements, highlights,
 * bullets, notes) stays one full-width row per fact, since those are
 * sentences worth seeing in full. Single-line (technologies, tags) renders
 * as a compact, wrapping chip input instead - a one-input-per-line list was
 * mostly empty space for what's usually a handful of short words. Shared by
 * the knowledge-base editor and the resume editor.
 */
export function StringListField({
  label,
  values,
  onChange,
  placeholder,
  multiline = false,
  addLabel = "Add",
}: StringListFieldProps) {
  if (!multiline) {
    return (
      <TagListField
        label={label}
        values={values}
        onChange={onChange}
        placeholder={placeholder}
      />
    );
  }

  function updateAt(index: number, value: string) {
    onChange(values.map((v, i) => (i === index ? value : v)));
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {values.length > 0 && (
        <div className="flex flex-col gap-2">
          {values.map((value, i) => (
            <div key={i} className="flex items-start gap-2">
              <Textarea
                value={value}
                placeholder={placeholder}
                onChange={(e) => updateAt(i, e.target.value)}
                className="min-h-14 text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mt-0.5 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeAt(i)}
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
        onClick={() => onChange([...values, ""])}
      >
        <Plus className="size-3.5" />
        {addLabel}
      </Button>
    </div>
  );
}

interface TagListFieldProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

/** Compact wrapping chip input - type a value, press Enter/comma to add, Backspace on an empty field to pop the last one. */
function TagListField({
  label,
  values,
  onChange,
  placeholder,
}: TagListFieldProps) {
  const [draft, setDraft] = useState("");

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...values, trimmed]);
    setDraft("");
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
      removeAt(values.length - 1);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-input px-2.5 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        {values.map((value, i) => (
          <Badge key={i} variant="outline" className="gap-1 pr-1 font-normal">
            {value}
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-2.5" />
            </button>
          </Badge>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder={values.length === 0 ? placeholder : "Add..."}
          className="min-w-24 flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
