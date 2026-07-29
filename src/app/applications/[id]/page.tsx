import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getApplication } from "@/lib/repositories/applicationRepository";
import { HeroRecommendationCard } from "@/components/job-analysis/HeroRecommendationCard";
import { MatchScoreExplainer } from "@/components/job-analysis/MatchScoreExplainer";
import { StrengthsCard } from "@/components/job-analysis/StrengthsCard";
import { RequirementCoverage } from "@/components/job-analysis/RequirementCoverage";
import { StatusSelect } from "@/components/status-select";
import { TailoredResumePanel } from "@/components/tailored-resume-panel";
import { CoverLetterPanel } from "@/components/cover-letter-panel";
import { JobDescriptionCard } from "@/components/job-description-card";
import { LocalDateTime } from "@/components/local-datetime";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isJobAnalysis } from "@/types/analysis";
import { isCoverLetterData } from "@/types/coverLetter";
import type { CoverLetterVersionDTO } from "@/components/cover-letter-panel";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const application = await getApplication(id, user.id);

  if (!application) {
    notFound();
  }

  let parsedAnalysis: unknown = null;
  if (application.analysis) {
    try {
      parsedAnalysis = JSON.parse(application.analysis.analysisJson);
    } catch {
      parsedAnalysis = null;
    }
  }
  const analysis =
    parsedAnalysis && isJobAnalysis(parsedAnalysis) ? parsedAnalysis : null;

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-16 dark:bg-black sm:px-8">
      <main className="flex w-full max-w-6xl flex-col gap-6">
        <Link
          href="/applications"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to applications
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              {application.jobTitle}
            </h1>
            <p className="text-muted-foreground">{application.company}</p>
            <a
              href={application.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground underline underline-offset-2"
            >
              View original posting
            </a>
          </div>
          <StatusSelect
            applicationId={application.id}
            status={application.status}
          />
        </div>

        {/* Verdict first: is this worth pursuing, and why - everything else
            on the page is either "act on it" (tailoring) or "the detail
            behind the verdict" (analysis), so it comes first. */}
        {analysis ? (
          <HeroRecommendationCard analysis={analysis} />
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No analysis data is available for this application.
            </CardContent>
          </Card>
        )}

        {/* The two things you actually come back to use, right after the
            verdict - not after scrolling past the full analysis every time. */}
        <div id="tailored-resume" className="scroll-mt-20">
          <TailoredResumePanel
            applicationId={application.id}
            versions={application.resumeVersions.map((version) => ({
              id: version.id,
              name: version.name,
              type: version.type,
              updatedAt: version.updatedAt,
            }))}
          />
        </div>

        <div id="cover-letter" className="scroll-mt-20">
          <CoverLetterPanel
            applicationId={application.id}
            initialVersions={application.coverLetterVersions.reduce<
              CoverLetterVersionDTO[]
            >((acc, version) => {
              try {
                const parsed = JSON.parse(version.coverLetterJson);
                if (isCoverLetterData(parsed)) {
                  acc.push({
                    id: version.id,
                    name: version.name,
                    coverLetter: parsed,
                  });
                }
              } catch {
                // Skip versions with corrupt JSON rather than crashing the page.
              }
              return acc;
            }, [])}
          />
        </div>

        {/* Everything below is reference material behind the verdict above:
            quantitative score, then a quick scan of strengths, then the
            single requirement-by-requirement checklist (covered items plus
            full reasoning on anything missing/partial) - skim-first,
            dig-in-if-needed, each requirement shown exactly once. */}
        {analysis && (
          <>
            <MatchScoreExplainer analysis={analysis} />
            <StrengthsCard strengths={analysis.strengths} />
            <RequirementCoverage coverage={analysis.coverage} />
          </>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="size-4 text-muted-foreground" />
              <CardTitle>Outcomes</CardTitle>
            </div>
            <CardDescription>
              Timeline of what happened with this application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {application.outcomes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No outcomes recorded yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {application.outcomes.map((outcome) => (
                  <li key={outcome.id} className="flex flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{outcome.stage}</span>
                      <LocalDateTime
                        date={outcome.createdAt}
                        className="text-xs text-muted-foreground"
                      />
                    </div>
                    {outcome.notes && (
                      <p className="whitespace-pre-wrap text-muted-foreground">
                        {outcome.notes}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <JobDescriptionCard
          jdMarkdown={application.analysis?.jdMarkdown ?? null}
        />
      </main>
    </div>
  );
}
