import { requireUser } from "@/lib/auth";
import {
  getBaseResume,
  getPublicResumes,
  getTailoredResumes,
} from "@/lib/repositories/resumeRepository";
import { ResumesHub } from "@/components/resumes/resumes-hub";

export const dynamic = "force-dynamic";

export default async function ResumesPage() {
  const user = await requireUser();
  const [baseResume, publicResumes, tailoredResumes] = await Promise.all([
    getBaseResume(user.id),
    getPublicResumes(user.id),
    getTailoredResumes(user.id),
  ]);

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-16 dark:bg-black sm:px-8">
      <main className="flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Resumes</h1>
          <p className="text-muted-foreground">
            Your base resume, your public resumes, and every tailored resume
            you&apos;ve generated - all in one place.
          </p>
        </div>

        <ResumesHub
          baseResume={
            baseResume
              ? {
                  id: baseResume.id,
                  name: baseResume.name,
                  type: baseResume.type,
                  updatedAt: baseResume.updatedAt,
                }
              : null
          }
          publicResumes={publicResumes.map((r) => ({
            id: r.id,
            name: r.name,
            type: r.type,
            updatedAt: r.updatedAt,
          }))}
          tailoredResumes={tailoredResumes.map((r) => ({
            id: r.id,
            name: r.name,
            type: r.type,
            updatedAt: r.updatedAt,
            application: r.application,
          }))}
        />
      </main>
    </div>
  );
}
