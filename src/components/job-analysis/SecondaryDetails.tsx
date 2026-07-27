"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { JobAnalysis } from "@/types/analysis";

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{title}</p>
      <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span>-</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Progressive disclosure for everything that isn't needed to make the
 * apply/skip/tailor decision: the raw ATS score (no longer a headline
 * metric) and the more granular wording/section suggestions, which matter
 * once you're actually editing the tailored resume, not before.
 */
export function SecondaryDetails({ analysis }: { analysis: JobAnalysis }) {
  const [open, setOpen] = useState(false);
  const hasContent =
    analysis.resumeWordingImprovements.length > 0 || analysis.resumeSectionsToRewrite.length > 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>More Details</CardTitle>
                <CardDescription>ATS score and detailed resume suggestions.</CardDescription>
              </div>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-180"
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Estimated ATS keyword match:{" "}
              <span className="font-medium text-foreground">{analysis.atsScore}/100</span>
            </p>
            {hasContent ? (
              <>
                <ListSection title="Resume Wording Improvements" items={analysis.resumeWordingImprovements} />
                <ListSection title="Resume Sections to Rewrite" items={analysis.resumeSectionsToRewrite} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No further suggestions.</p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
