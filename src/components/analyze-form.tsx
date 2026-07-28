"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  KeyRound,
  Loader2,
  Sparkles,
  BookUser,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HeroRecommendationCard } from "@/components/job-analysis/HeroRecommendationCard";
import { JobDescriptionCard } from "@/components/job-description-card";
import type { JobAnalysis } from "@/types/analysis";

interface AnalyzeFormProps {
  hasApiKey: boolean;
  hasKnowledgeBase: boolean;
}

export function AnalyzeForm({ hasApiKey, hasKnowledgeBase }: AnalyzeFormProps) {
  const [jobUrl, setJobUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const isReady = hasApiKey && hasKnowledgeBase;

  async function handleAnalyze(force = false) {
    if (!jobUrl || isAnalyzing || !isReady) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setApplicationId(null);
    setJobDescription(null);

    try {
      const params = new URLSearchParams({ url: jobUrl });
      if (force) params.set("force", "true");
      const res = await fetch(`/api/analyze?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setAnalysis(data.analysis);
      setApplicationId(data.applicationId ?? null);
      setJobDescription(data.jobDescription ?? null);
      setCached(Boolean(data.cached));
    } catch {
      setError("Failed to reach the analysis service.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-16 dark:bg-black sm:px-8">
      <main className="flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-col gap-2 text-center sm:text-left">
          <h1 className="text-3xl font-semibold tracking-tight">
            Resume Copilot
          </h1>
          <p className="text-muted-foreground">
            Paste a job posting URL to see how well your resume matches.
          </p>
        </div>

        {!isReady && (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="flex flex-col gap-3 py-5">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Finish setup before analyzing a job:
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                {!hasApiKey && (
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-background px-3 py-2 text-sm font-medium hover:bg-amber-500/10"
                  >
                    <KeyRound className="size-4 text-amber-600 dark:text-amber-400" />
                    Add your Gemini API key
                    <ArrowRight className="size-3.5" />
                  </Link>
                )}
                {!hasKnowledgeBase && (
                  <Link
                    href="/knowledge-base"
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
            handleAnalyze();
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <Input
            type="url"
            placeholder="https://example.com/careers/job-posting"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            disabled={!isReady}
            className="flex-1"
          />
          <Button type="submit" disabled={!jobUrl || isAnalyzing || !isReady}>
            {isAnalyzing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analyzing...
              </>
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

        {analysis ? (
          <div className="flex flex-col gap-4">
            {cached && (
              <p className="text-sm text-muted-foreground">
                Showing your last analysis of this posting - nothing changed
                since then, so no AI call was made.{" "}
                <button
                  type="button"
                  onClick={() => handleAnalyze(true)}
                  className="underline hover:text-foreground"
                >
                  Re-analyze anyway
                </button>
              </p>
            )}
            {/* Condensed on purpose: the full breakdown (score dimensions,
                coverage, gap-by-gap detail, quick wins, recruiter notes) lives
                once, permanently, on the application page — showing it here
                too would just be the same dashboard rendered twice a few
                seconds apart. */}
            <HeroRecommendationCard
              analysis={analysis}
              ctaHref={
                applicationId
                  ? `/applications/${applicationId}#tailored-resume`
                  : "/applications"
              }
            />
            {applicationId && (
              <Link
                href={`/applications/${applicationId}`}
                className="flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                View full analysis, requirement coverage, and gaps
                <ArrowRight className="size-3.5" />
              </Link>
            )}
            <JobDescriptionCard jdMarkdown={jobDescription} />
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              {isAnalyzing ? (
                <>
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Reading the job posting and comparing it against your
                    resume...
                  </p>
                </>
              ) : (
                <>
                  <Sparkles className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {isReady
                      ? "Paste a job posting URL above and click Analyze to see your match dashboard."
                      : "Finish the setup steps above to start analyzing job postings."}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
