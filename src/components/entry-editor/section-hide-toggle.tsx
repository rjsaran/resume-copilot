"use client";

import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Hides/shows an entire section (knowledge base or resume) from the Base Resume, AI tailoring, and any rendered/exported output - independent of any individual item's own hidden flag. Icon-only: the eye/eye-off state is the label. */
export function SectionHideToggle({
  hidden,
  onToggle,
}: {
  hidden: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="shrink-0 text-muted-foreground"
      title={hidden ? "Show this section" : "Hide this section"}
      onClick={onToggle}
    >
      {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </Button>
  );
}
