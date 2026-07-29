"use client";

import { useState, type HTMLAttributes, type ReactNode } from "react";
import { ChevronDown, Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
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
  hidden?: boolean;
  onToggleHidden?: () => void;
  onRemove: () => void;
  /** Spread onto the drag handle when the parent list supports reordering (see EntryList). Omit to render no handle. */
  dragHandleProps?: HTMLAttributes<HTMLSpanElement>;
  children: ReactNode;
}

/** Collapsible card for one list entry (an experience, project, or education item) - shared by the knowledge-base editor and the resume editor. */
export function EntryCard({
  title,
  subtitle,
  defaultOpen = false,
  hidden = false,
  onToggleHidden,
  onRemove,
  dragHandleProps,
  children,
}: EntryCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={cn(hidden && "opacity-60")}>
        <div className="flex items-center gap-1 pr-4">
          {dragHandleProps && (
            <span
              {...dragHandleProps}
              className="flex shrink-0 cursor-grab touch-none items-center self-stretch px-1 text-muted-foreground active:cursor-grabbing"
            >
              <GripVertical className="size-4" />
            </span>
          )}
          <CollapsibleTrigger className="min-w-0 flex-1 text-left">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {title || "Untitled"}
                    {hidden && (
                      <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
                        Hidden
                      </span>
                    )}
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
          {onToggleHidden && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground"
              title={hidden ? "Show on resumes" : "Hide from resumes"}
              onClick={onToggleHidden}
            >
              {hidden ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
            </Button>
          )}
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
