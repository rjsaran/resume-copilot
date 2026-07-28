import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
import { LocalDateTime } from "@/components/local-datetime";
import type { Application } from "@/lib/db/schema";

export function ApplicationsTable({
  applications,
}: {
  applications: Application[];
}) {
  return (
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
              <Badge className={STATUS_BADGE_CLASSNAME[application.status]}>
                {STATUS_LABELS[application.status]}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              <LocalDateTime date={application.createdAt} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
