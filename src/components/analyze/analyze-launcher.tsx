"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  KeyRound,
  Loader2,
  Sparkles,
  BookUser,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { HeroRecommendationCard } from "@/components/job-analysis/HeroRecommendationCard";
import { JobDescriptionCard } from "@/components/job-description-card";
import { cn } from "@/lib/utils";
import { useAnalyze } from "@/components/analyze/analyze-context";

const DIALOG_COPY = {
  form: {
    title: "Analyze a job posting",
    description: "Paste a job posting URL to see how well your resume matches.",
  },
  analyzing: {
    title: "Analyzing…",
    description: "This runs in the background - feel free to keep browsing.",
  },
  result: {
    title: "Analysis ready",
    description: "Here's how your resume matches this posting.",
  },
  error: {
    title: "Analysis failed",
    description: "Something went wrong reaching the analysis service.",
  },
} as const;

function Fab({
  phase,
  hasUnseenResult,
  onClick,
}: {
  phase: "form" | "analyzing" | "result" | "error";
  hasUnseenResult: boolean;
  onClick: () => void;
}) {
  const isAlert = hasUnseenResult && (phase === "result" || phase === "error");
  const isError = hasUnseenResult && phase === "error";

  const icon =
    phase === "analyzing" ? (
      <Loader2 className="size-5 animate-spin" />
    ) : isAlert ? (
      isError ? (
        <AlertCircle className="size-5" />
      ) : (
        <CheckCircle2 className="size-5" />
      )
    ) : (
      <Sparkles className="size-5" />
    );

  const label =
    phase === "analyzing"
      ? "Analyzing…"
      : isAlert
        ? isError
          ? "Analysis failed"
          : "Analysis ready"
        : "Analyze";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full px-4 py-3.5 text-sm font-medium shadow-lg shadow-black/10 transition-all hover:scale-[1.03] active:scale-[0.98]",
        isError
          ? "bg-red-600 text-white hover:bg-red-600/90"
          : isAlert
            ? "bg-emerald-600 text-white hover:bg-emerald-600/90"
            : "bg-primary text-primary-foreground hover:bg-primary/90",
      )}
    >
      {icon}
      <span>{label}</span>
      {hasUnseenResult && (
        <span className="absolute -top-1 -right-1 flex size-3">
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              isError ? "bg-red-400" : "bg-emerald-400",
            )}
          />
          <span
            className={cn(
              "relative inline-flex size-3 rounded-full",
              isError ? "bg-red-500" : "bg-emerald-500",
            )}
          />
        </span>
      )}
    </button>
  );
}

export function AnalyzeLauncher() {
  const pathname = usePathname();
  const {
    open,
    phase,
    jobUrl,
    error,
    analysis,
    applicationId,
    jobDescription,
    cached,
    readiness,
    readinessLoading,
    hasUnseenResult,
    openLauncher,
    closeLauncher,
    setJobUrl,
    submit,
    startOver,
  } = useAnalyze();

  // Same routes NavBar hides app chrome on: a print-ready document should
  // never show floating UI, on screen or on paper.
  if (pathname.includes("/resume/") && pathname.endsWith("/preview")) {
    return null;
  }
  if (pathname === "/sign-in") return null;

  const isReady = Boolean(readiness?.hasApiKey && readiness?.hasKnowledgeBase);
  const copy = DIALOG_COPY[phase];

  return (
    <>
      <Fab phase={phase} hasUnseenResult={hasUnseenResult} onClick={openLauncher} />

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeLauncher();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>{copy.description}</DialogDescription>
          </DialogHeader>

          {phase === "form" && (
            <div className="flex flex-col gap-4">
              {!readinessLoading && readiness && !isReady && (
                <Card className="border-amber-500/50 bg-amber-500/5">
                  <CardContent className="flex flex-col gap-3 py-5">
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      Finish setup before analyzing a job:
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      {!readiness.hasApiKey && (
                        <Link
                          href="/settings"
                          onClick={closeLauncher}
                          className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-background px-3 py-2 text-sm font-medium hover:bg-amber-500/10"
                        >
                          <KeyRound className="size-4 text-amber-600 dark:text-amber-400" />
                          Add your API key
                          <ArrowRight className="size-3.5" />
                        </Link>
                      )}
                      {!readiness.hasKnowledgeBase && (
                        <Link
                          href="/knowledge-base"
                          onClick={closeLauncher}
                          className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-background px-3 py-2 text-sm font-medium hover:bg-amber-500/10"
                        >
                          <BookUser className="size-4 text-amber-600 dark:text-amber-400" />
                          Add your knowledge base
                          <ArrowRight className="size-3.5" />
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <Input
                  autoFocus
                  type="url"
                  placeholder="https://example.com/careers/job-posting"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  disabled={!isReady || readinessLoading}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={!jobUrl || !isReady || readinessLoading}
                >
                  {readinessLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Analyze"
                  )}
                </Button>
              </form>

              {error && (
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardContent className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {phase === "analyzing" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Reading the job posting and comparing it against your
                resume…
              </p>
              <p className="text-xs text-muted-foreground">
                You can close this dialog and keep using the app -
                we&apos;ll let you know when it&apos;s done.
              </p>
            </div>
          )}

          {phase === "result" && analysis && (
            <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
              {cached && (
                <p className="text-sm text-muted-foreground">
                  Showing your last analysis of this posting - nothing
                  changed since then, so no AI call was made.{" "}
                  <button
                    type="button"
                    onClick={() => submit(true)}
                    className="underline hover:text-foreground"
                  >
                    Re-analyze anyway
                  </button>
                </p>
              )}
              <HeroRecommendationCard analysis={analysis} />
              {applicationId && (
                <Link
                  href={`/applications/${applicationId}`}
                  onClick={closeLauncher}
                  className="flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground hover:underline"
                >
                  View full analysis, requirement coverage, and gaps
                  <ArrowRight className="size-3.5" />
                </Link>
              )}
              <JobDescriptionCard jdMarkdown={jobDescription} />
              <Button variant="outline" onClick={startOver} className="self-start">
                Analyze another job
              </Button>
            </div>
          )}

          {phase === "error" && (
            <div className="flex flex-col gap-4">
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </CardContent>
              </Card>
              <Button variant="outline" onClick={startOver} className="self-start">
                Try again
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
