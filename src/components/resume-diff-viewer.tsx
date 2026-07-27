"use client";

import { useMemo } from "react";
import { diffLines } from "diff";
import { cn } from "@/lib/utils";

type DiffRowType = "same" | "added" | "removed" | "empty";

interface DiffRow {
  type: DiffRowType;
  text: string;
}

function splitDiffValueIntoLines(value: string): string[] {
  const lines = value.split("\n");
  // A diff chunk that ends in "\n" produces one trailing empty string from
  // split() — drop it so we don't render a phantom blank row.
  if (lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines;
}

function buildDiffColumns(
  before: string,
  after: string
): { left: DiffRow[]; right: DiffRow[] } {
  const parts = diffLines(before, after);
  const left: DiffRow[] = [];
  const right: DiffRow[] = [];

  for (const part of parts) {
    const lines = splitDiffValueIntoLines(part.value);

    if (part.added) {
      for (const line of lines) {
        left.push({ type: "empty", text: "" });
        right.push({ type: "added", text: line });
      }
    } else if (part.removed) {
      for (const line of lines) {
        left.push({ type: "removed", text: line });
        right.push({ type: "empty", text: "" });
      }
    } else {
      for (const line of lines) {
        left.push({ type: "same", text: line });
        right.push({ type: "same", text: line });
      }
    }
  }

  return { left, right };
}

function DiffColumn({ title, rows }: { title: string; rows: DiffRow[] }) {
  return (
    <div className="flex min-w-0 flex-col">
      <div className="border-b bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
        {title}
      </div>
      <div className="max-h-[36rem] overflow-y-auto font-mono text-xs leading-relaxed">
        {rows.map((row, i) => (
          <div
            key={i}
            className={cn(
              "min-h-[1.25rem] px-3 py-0.5 whitespace-pre-wrap",
              row.type === "added" &&
                "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
              row.type === "removed" &&
                "bg-red-500/15 text-red-800 dark:text-red-400",
              row.type === "empty" && "bg-muted/40"
            )}
          >
            {row.text || " "}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResumeDiffViewer({
  beforeTitle,
  afterTitle,
  before,
  after,
}: {
  beforeTitle: string;
  afterTitle: string;
  before: string;
  after: string;
}) {
  const { left, right } = useMemo(
    () => buildDiffColumns(before, after),
    [before, after]
  );

  return (
    <div className="grid grid-cols-1 divide-y overflow-hidden rounded-md border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
      <DiffColumn title={beforeTitle} rows={left} />
      <DiffColumn title={afterTitle} rows={right} />
    </div>
  );
}
