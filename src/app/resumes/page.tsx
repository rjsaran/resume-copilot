import { requireUser } from "@/lib/auth";
import {
  getBaseResume,
  getPublicResumes,
  getTailoredResumes,
  getGenerationNotes,
} from "@/lib/repositories/resumeRepository";
import { ResumesHub } from "@/components/resumes/resumes-hub";

export const dynamic = "force-dynamic";

export default async function ResumesPage() {
  const user = await requireUser();
  const [baseResume, publicResumes, tailoredResumes, gapNotes] = await Promise.all([
    getBaseResume(user.id),
    getPublicResumes(user.id),
    getTailoredResumes(user.id),
    getGenerationNotes(user.id),
  ]);

  return (
    <div className="flex flex-1 flex-col items-center bg-muted/30 px-4 py-16 sm:px-8">
      <main className="flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Resumes</h1>
          <p className="text-muted-foreground">
            Your base resume, the resumes cloned from it, and every tailored
            resume you&apos;ve generated - all in one place.
          </p>
        </div>

        <ResumesHub
          baseResume={
            baseResume
              ? {
                  id: baseResume.id,
                  name: baseResume.name,
                  type: baseResume.type,
                  createdAt: baseResume.createdAt,
                }
              : null
          }
          publicResumes={publicResumes.map((r) => ({
            id: r.id,
            name: r.name,
            type: r.type,
            createdAt: r.createdAt,
          }))}
          tailoredResumes={tailoredResumes.map((r) => ({
            id: r.id,
            name: r.name,
            type: r.type,
            createdAt: r.createdAt,
            application: r.application,
          }))}
          gapNotes={gapNotes}
        />
      </main>
    </div>
  );
}
