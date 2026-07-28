import { requireUser } from "@/lib/auth";
import { getApplications } from "@/lib/repositories/applicationRepository";
import { Card, CardContent } from "@/components/ui/card";
import { ApplicationsView } from "@/components/applications/applications-view";

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
          <ApplicationsView applications={applications} />
        )}
      </main>
    </div>
  );
}
