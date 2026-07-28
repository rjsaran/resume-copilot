import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getApplications } from "@/lib/repositories/applicationRepository";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RECOMMENDATION_META,
  isRecommendationStatus,
  STATUS_BADGE_CLASSNAME,
  STATUS_LABELS,
} from "@/lib/badge-meta";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const user = await requireUser();
  const applications = await getApplications(user.id);

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-16 dark:bg-black sm:px-8">
      <main className="flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Applications
          </h1>
          <p className="text-muted-foreground">
            Every job you have analyzed, tracked in one place.
          </p>
        </div>

        {applications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No applications yet. Analyze a job posting to get started.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Verdict</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id} className="relative">
                      <TableCell className="font-medium">
                        <Link
                          href={`/applications/${application.id}`}
                          className="after:absolute after:inset-0 after:content-[''] hover:underline"
                        >
                          {application.company}
                        </Link>
                      </TableCell>
                      <TableCell>{application.jobTitle}</TableCell>
                      <TableCell className="tabular-nums">
                        {application.overallScore}/100
                      </TableCell>
                      <TableCell>
                        {isRecommendationStatus(application.verdict) ? (
                          <Badge
                            className={
                              RECOMMENDATION_META[application.verdict].badgeClassName
                            }
                          >
                            {application.verdict}
                          </Badge>
                        ) : (
                          <Badge variant="outline">{application.verdict}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={STATUS_BADGE_CLASSNAME[application.status]}
                        >
                          {STATUS_LABELS[application.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {application.createdAt.toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
