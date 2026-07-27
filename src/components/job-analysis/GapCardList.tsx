"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { sortBySeverity, SEVERITY_META } from "@/components/job-analysis/severity";
import type { Gap } from "@/types/analysis";

function GapCard({ gap }: { gap: Gap }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{gap.title}</CardTitle>
                <Badge className={SEVERITY_META[gap.severity].badgeClassName}>
                  {SEVERITY_META[gap.severity].label}
                </Badge>
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
          <CardContent className="flex flex-col gap-3 text-sm">
            <div>
              <p className="font-medium text-muted-foreground">Why it matters</p>
              <p>{gap.whyItMatters}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Why we flagged this</p>
              <p>{gap.reason}</p>
            </div>
            <div className="flex items-start gap-2">
              {gap.aiCanFix ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-500" />
              )}
              <div>
                <p className="font-medium">
                  {gap.aiCanFix ? "AI can help with this" : "AI can't fix this"}
                </p>
                <p className="text-muted-foreground">{gap.aiFixNote}</p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function GapCardList({ gaps }: { gaps: Gap[] }) {
  if (gaps.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-muted-foreground">Gap details</h3>
      {sortBySeverity(gaps).map((gap, i) => (
        <GapCard key={i} gap={gap} />
      ))}
    </div>
  );
}
