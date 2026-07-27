"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { JobAnalysisDashboard } from "@/components/job-analysis-dashboard";
import type { JobAnalysis } from "@/types/analysis";

export default function Home() {
  const [jobUrl, setJobUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!jobUrl || isAnalyzing) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setApplicationId(null);

    try {
      const res = await fetch(`/api/analyze?url=${encodeURIComponent(jobUrl)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setAnalysis(data.analysis);
      setApplicationId(data.applicationId ?? null);
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
            className="flex-1"
          />
          <Button type="submit" disabled={!jobUrl || isAnalyzing}>
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
            {applicationId && (
              <Link
                href={`/applications/${applicationId}`}
                className="flex items-center gap-1.5 self-end text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                Saved to your applications
                <ArrowRight className="size-3.5" />
              </Link>
            )}
            <JobAnalysisDashboard analysis={analysis} />
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
                    Paste a job posting URL above and click Analyze to see
                    your match dashboard.
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
