"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EntryCardProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  onRemove: () => void;
  children: ReactNode;
}

/** Collapsible card for one list entry (an experience, project, or education item) - shared by all three sections. */
export function EntryCard({
  title,
  subtitle,
  defaultOpen = false,
  onRemove,
  children,
}: EntryCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <div className="flex items-center gap-1 pr-4">
          <CollapsibleTrigger className="min-w-0 flex-1 text-left">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {title || "Untitled"}
                  </p>
                  {subtitle && (
                    <p className="truncate text-xs text-muted-foreground">
                      {subtitle}
                    </p>
                  )}
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
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
        <CollapsibleContent>
          <CardContent className="flex flex-col gap-3">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
