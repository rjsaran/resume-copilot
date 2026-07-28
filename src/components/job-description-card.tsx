"use client";

import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/**
 * Collapsed by default and placed last on the application detail page - the
 * raw posting text is reference material, not something to lead with above
 * the analysis, tailoring, and status history.
 */
export function JobDescriptionCard({
  jdMarkdown,
}: {
  jdMarkdown: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <CardTitle>Original Job Description</CardTitle>
                </div>
                <CardDescription>
                  Extracted markdown from the posting URL.
                </CardDescription>
              </div>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-180",
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            {jdMarkdown ? (
              <pre className="max-h-96 overflow-y-auto rounded-md bg-muted p-4 text-xs whitespace-pre-wrap text-muted-foreground">
                {jdMarkdown}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                No job description saved.
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
