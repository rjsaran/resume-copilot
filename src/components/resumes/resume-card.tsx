"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Copy, Download, Loader2, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocalDateTime } from "@/components/local-datetime";
import { renameResumeAction } from "@/app/resumes/actions";
import type { ResumeVersionType } from "@/lib/db/schema";

export interface ResumeCardSummary {
  id: string;
  name: string;
  type: ResumeVersionType;
  createdAt: Date;
  application?: { id: string; company: string; jobTitle: string } | null;
}

/** BASE and AI resumes get a colored badge; PUBLIC (cloned) resumes get none, since a clone's whole point is to look like an ordinary resume. */
function originBadge(
  type: ResumeVersionType,
): { label: string; variant: "default" | "outline" | "secondary" } | null {
  switch (type) {
    case "BASE":
      return { label: "Base", variant: "secondary" };
    case "PUBLIC":
      return null;
    case "MANUAL":
      return { label: "Manual", variant: "outline" };
    default:
      return { label: "AI", variant: "default" };
  }
}

export function ResumeCard({
  resume,
  onDelete,
  isDeleting,
  onClone,
  isCloning,
}: {
  resume: ResumeCardSummary;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
  onClone?: (id: string) => void;
  isCloning?: boolean;
}) {
  const router = useRouter();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(resume.name);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isRenaming, startRename] = useTransition();

  const badge = originBadge(resume.type);
  const canClone = resume.type === "BASE" || resume.type === "PUBLIC";

  function openResume() {
    router.push(`/resumes/${resume.id}?from=resumes`);
  }

  function startEditingName() {
    setNameDraft(resume.name);
    setRenameError(null);
    setIsEditingName(true);
  }

  function commitRename() {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === resume.name) {
      setNameDraft(resume.name);
      setIsEditingName(false);
      return;
    }
    startRename(async () => {
      const result = await renameResumeAction(resume.id, trimmed);
      if (!result.success) {
        setRenameError(result.error ?? "Failed to rename.");
        return;
      }
      setIsEditingName(false);
      router.refresh();
    });
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={openResume}
      onKeyDown={(e) => {
        if (e.key === "Enter") openResume();
      }}
      className="cursor-pointer transition-colors hover:bg-muted/40"
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          {isEditingName ? (
            <Input
              autoFocus
              value={nameDraft}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                setNameDraft(e.target.value);
                setRenameError(null);
              }}
              onBlur={commitRename}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitRename();
                }
                if (e.key === "Escape") {
                  setNameDraft(resume.name);
                  setIsEditingName(false);
                }
              }}
              disabled={isRenaming}
              className="h-7 min-w-0 text-base font-medium"
            />
          ) : (
            <CardTitle
              className="min-w-0 truncate text-base"
              onClick={(e) => {
                e.stopPropagation();
                startEditingName();
              }}
              title="Click to rename"
            >
              {resume.name}
            </CardTitle>
          )}
          {badge && (
            <Badge variant={badge.variant} className="shrink-0">
              {badge.label}
            </Badge>
          )}
        </div>
        {renameError && <p className="text-xs text-destructive">{renameError}</p>}
        {resume.application && (
          <CardDescription className="truncate">
            <Link
              href={`/applications/${resume.application.id}`}
              className="hover:text-foreground hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {resume.application.jobTitle} · {resume.application.company}
            </Link>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <LocalDateTime date={resume.createdAt} className="text-xs text-muted-foreground" />
        <div className="flex flex-wrap gap-2">
          {canClone && onClone && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onClone(resume.id);
              }}
              disabled={isCloning}
            >
              {isCloning ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Copy className="size-3.5" />
              )}
              Clone
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`/api/resume/${resume.id}/pdf`, "_blank");
            }}
          >
            <Download className="size-3.5" />
            PDF
          </Button>
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(resume.id);
              }}
              disabled={isDeleting}
              className="text-destructive hover:text-destructive"
            >
              {isDeleting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
