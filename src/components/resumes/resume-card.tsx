"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Download, Loader2, Pencil, SquarePen, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { LocalDateTime } from "@/components/local-datetime";
import { renameResumeAction } from "@/app/resumes/actions";
import type { ResumeVersionType } from "@/lib/db/schema";

export interface ResumeCardSummary {
  id: string;
  name: string;
  type: ResumeVersionType;
  updatedAt: Date;
  application?: { id: string; company: string; jobTitle: string } | null;
}

function originLabel(type: ResumeVersionType): string {
  switch (type) {
    case "MANUAL":
      return "Manual";
    case "PUBLIC":
      return "Public";
    case "BASE":
      return "Base";
    default:
      return "AI";
  }
}

export function ResumeCard({
  resume,
  onDelete,
  isDeleting,
}: {
  resume: ResumeCardSummary;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(resume.name);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isRenaming, startRename] = useTransition();

  function openRename() {
    setNameDraft(resume.name);
    setRenameError(null);
    setRenameOpen(true);
  }

  function handleRename() {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === resume.name) {
      setRenameOpen(false);
      return;
    }
    startRename(async () => {
      const result = await renameResumeAction(resume.id, trimmed);
      if (!result.success) {
        setRenameError(result.error ?? "Failed to rename.");
        return;
      }
      setRenameOpen(false);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="min-w-0 truncate text-base">{resume.name}</CardTitle>
          <Badge variant="outline" className="shrink-0">
            {originLabel(resume.type)}
          </Badge>
        </div>
        {resume.application && (
          <CardDescription className="truncate">
            <Link
              href={`/applications/${resume.application.id}`}
              className="hover:text-foreground hover:underline"
            >
              {resume.application.jobTitle} · {resume.application.company}
            </Link>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <LocalDateTime date={resume.updatedAt} className="text-xs text-muted-foreground" />
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href={`/resumes/${resume.id}?from=resumes`} />}
          >
            <Pencil className="size-3.5" />
            Open
          </Button>
          <Button size="sm" variant="outline" onClick={openRename}>
            <SquarePen className="size-3.5" />
            Rename
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`/api/resume/${resume.id}/pdf`, "_blank")}
          >
            <Download className="size-3.5" />
            PDF
          </Button>
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(resume.id)}
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

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename resume</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={nameDraft}
            onChange={(e) => {
              setNameDraft(e.target.value);
              setRenameError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleRename();
              }
            }}
            placeholder="e.g. Fintech Resume, LinkedIn Resume"
          />
          {renameError && <p className="text-sm text-destructive">{renameError}</p>}
          <DialogFooter>
            <Button onClick={handleRename} disabled={isRenaming || !nameDraft.trim()}>
              {isRenaming && <Loader2 className="size-3.5 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
