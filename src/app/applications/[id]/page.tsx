import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getApplication } from "@/lib/repositories/applicationRepository";
import { JobAnalysisDashboard } from "@/components/job-analysis-dashboard";
import { StatusSelect } from "@/components/status-select";
import { TailoredResumePanel } from "@/components/tailored-resume-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isJobAnalysis } from "@/types/analysis";
import { isResumeData } from "@/types/resume";
import type { ResumeVersionDTO } from "@/components/tailored-resume-panel";

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

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-16 dark:bg-black sm:px-8">
      <main className="flex w-full max-w-4xl flex-col gap-6">
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
          <StatusSelect applicationId={application.id} status={application.status} />
        </div>

        {parsedAnalysis && isJobAnalysis(parsedAnalysis) ? (
          <JobAnalysisDashboard analysis={parsedAnalysis} />
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No analysis data is available for this application.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              <CardTitle>Original Job Description</CardTitle>
            </div>
            <CardDescription>
              Extracted markdown from the posting URL.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {application.analysis ? (
              <pre className="max-h-96 overflow-y-auto rounded-md bg-muted p-4 text-xs whitespace-pre-wrap text-muted-foreground">
                {application.analysis.jdMarkdown}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                No job description saved.
              </p>
            )}
          </CardContent>
        </Card>

        <TailoredResumePanel
          applicationId={application.id}
          initialVersions={application.resumeVersions.reduce<ResumeVersionDTO[]>(
            (acc, version) => {
              try {
                const parsed = JSON.parse(version.resumeJson);
                if (isResumeData(parsed)) {
                  acc.push({
                    id: version.id,
                    name: version.name,
                    type: version.type,
                    resume: parsed,
                  });
                }
              } catch {
                // Skip versions with corrupt JSON rather than crashing the page.
              }
              return acc;
            },
            []
          )}
        />

        <Card>
          <CardHeader>
            <CardTitle>Outcomes</CardTitle>
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
                      <span className="text-xs text-muted-foreground">
                        {outcome.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    {outcome.notes && (
                      <p className="text-muted-foreground">{outcome.notes}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
