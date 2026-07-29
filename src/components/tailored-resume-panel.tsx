"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ChevronDown,
  Download,
  Loader2,
  Pencil,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LocalDateTime } from "@/components/local-datetime";
import { cn } from "@/lib/utils";
import {
  generateTailoredResumeAction,
  createManualResumeVersionAction,
} from "@/app/applications/[id]/actions";
import type { ResumeVersionType } from "@/lib/db/schema";

export interface ResumeVersionSummary {
  id: string;
  name: string;
  type: ResumeVersionType;
  updatedAt: Date;
}

/** TAILORED is the retired name for what's now created as AI - treat both the same in the UI. */
function originLabel(type: ResumeVersionType): "AI" | "Manual" {
  return type === "MANUAL" ? "Manual" : "AI";
}

/**
 * A lightweight summary - the actual editor/preview for any resume (base,
 * public, or tailored) lives at /resumes/[id], the single canonical place
 * resumes are viewed and edited (see the Resumes hub). This panel only
 * lists what's been generated for this application and lets you start a
 * new one; it never embeds the editor itself.
 */
export function TailoredResumePanel({
  applicationId,
  versions: initialVersions,
}: {
  applicationId: string;
  versions: ResumeVersionSummary[];
}) {
  const router = useRouter();
  const [versions, setVersions] = useState<ResumeVersionSummary[]>(initialVersions);
  const [open, setOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerate] = useTransition();
  const [confirmAction, setConfirmAction] = useState<{
    message: string;
    run: () => void;
  } | null>(null);

  function runOrConfirm(message: string, run: () => void) {
    if (versions.length === 0) {
      run();
      return;
    }
    setConfirmAction({ message, run });
  }

  function handleGenerateAi() {
    if (isGenerating) return; // guard against a double-click firing twice
    runOrConfirm(
      "Regenerate the tailored resume? This uses another AI call and adds a new version.",
      () => {
        setError(null);
        startGenerate(async () => {
          const result = await generateTailoredResumeAction(applicationId);
          if (!result.success || !result.resumeVersion) {
            setError(result.error ?? "Failed to generate tailored resume.");
            return;
          }
          const created = result.resumeVersion;
          setVersions((prev) => [
            { id: created.id, name: created.name, type: created.type, updatedAt: created.updatedAt },
            ...prev,
          ]);
          setOpen(true);
          router.push(`/resumes/${created.id}`);
        });
      },
    );
  }

  function handleCreateManual() {
    runOrConfirm(
      "Create a new manual resume from your base resume? You'll trim and edit it on its own page next.",
      () => {
        setError(null);
        startGenerate(async () => {
          const result = await createManualResumeVersionAction(applicationId);
          if (!result.success || !result.resumeVersion) {
            setError(result.error ?? "Failed to create manual resume.");
            return;
          }
          const created = result.resumeVersion;
          setVersions((prev) => [
            { id: created.id, name: created.name, type: created.type, updatedAt: created.updatedAt },
            ...prev,
          ]);
          setOpen(true);
          router.push(`/resumes/${created.id}`);
        });
      },
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CollapsibleTrigger className="flex items-start gap-2 text-left">
              <ChevronDown
                className={cn(
                  "mt-1 size-4 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-180",
                )}
              />
              <div>
                <CardTitle>Tailored Resumes</CardTitle>
                <CardDescription>
                  AI-tailored or hand-built resumes for this job - opened and
                  edited on the Resumes page.
                </CardDescription>
              </div>
            </CollapsibleTrigger>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button size="sm" disabled={isGenerating} />}>
                {isGenerating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {versions.length === 0 ? "Generate Resume" : "Regenerate"}
                <ChevronDown className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleGenerateAi} disabled={isGenerating}>
                  <Sparkles />
                  Generate with AI
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCreateManual} disabled={isGenerating}>
                  <Pencil />
                  Create Manually
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="flex flex-col gap-3">
            {error && (
              <p className="rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isGenerating
                  ? "Working on it - this can take a little while..."
                  : "No resume yet. Click “Generate Resume” to tailor one with AI, or create one manually from your base resume - good matches often don't need AI at all."}
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {versions.map((version) => (
                  <li
                    key={version.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{version.name}</p>
                        <Badge variant="outline">{originLabel(version.type)}</Badge>
                      </div>
                      <LocalDateTime
                        date={version.updatedAt}
                        className="text-xs text-muted-foreground"
                      />
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        nativeButton={false}
                        render={<Link href={`/resumes/${version.id}`} />}
                      >
                        <Pencil className="size-3.5" />
                        Open
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/api/resume/${version.id}/pdf`, "_blank")}
                      >
                        <Download className="size-3.5" />
                        PDF
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(next) => {
          if (!next) setConfirmAction(null);
        }}
        title="Regenerate this resume?"
        description={confirmAction?.message}
        confirmLabel="Continue"
        isLoading={isGenerating}
        onConfirm={() => {
          confirmAction?.run();
          setConfirmAction(null);
        }}
      />
    </Collapsible>
  );
}
