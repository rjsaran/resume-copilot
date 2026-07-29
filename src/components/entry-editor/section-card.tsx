"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { SectionHideToggle } from "@/components/entry-editor/section-hide-toggle";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  description?: string;
  /** Whether the whole section can be collapsed independently of its entries. Off for sections that are always short enough to just show (e.g. Technologies). */
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** Omit entirely for sections that can't be hidden (e.g. Personal Info/Basics - there's no meaningful "hidden contact info"). */
  hidden?: boolean;
  onToggleHidden?: () => void;
  children: ReactNode;
}

/** Shared card shell for a knowledge-base or resume-editor section - optional collapse and optional whole-section hide, used identically in both editors. The hide toggle sits outside the collapse trigger so toggling visibility never also expands/collapses the section. */
export function SectionCard({
  title,
  description,
  collapsible = false,
  defaultOpen = true,
  hidden,
  onToggleHidden,
  children,
}: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  const titleBlock = (
    <div className="min-w-0">
      <CardTitle>{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </div>
  );

  const header = (
    <CardHeader className="flex flex-row items-start justify-between gap-4">
      {collapsible ? (
        <CollapsibleTrigger className="flex min-w-0 flex-1 items-start gap-2 text-left">
          <ChevronDown
            className={cn(
              "mt-1 size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
          {titleBlock}
        </CollapsibleTrigger>
      ) : (
        titleBlock
      )}
      {onToggleHidden && (
        <SectionHideToggle hidden={hidden ?? false} onToggle={onToggleHidden} />
      )}
    </CardHeader>
  );

  if (!collapsible) {
    return (
      <Card>
        {header}
        <CardContent className="flex flex-col gap-3">{children}</CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        {header}
        <CollapsibleContent>
          <CardContent className="flex flex-col gap-3">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
