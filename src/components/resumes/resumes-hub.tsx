"use client";

import { Tabs, TabsList, TabsIndicator, TabsTab, TabsPanel } from "@/components/ui/tabs";
import { BaseResumePanel } from "@/components/resumes/base-resume-panel";
import { TailoredResumesPanel } from "@/components/resumes/tailored-resumes-panel";
import { GapNotesPanel, type GapNoteSummary } from "@/components/resumes/gap-notes-panel";
import type { ResumeCardSummary } from "@/components/resumes/resume-card";

export function ResumesHub({
  baseResume,
  publicResumes,
  tailoredResumes,
  gapNotes,
}: {
  baseResume: ResumeCardSummary | null;
  publicResumes: ResumeCardSummary[];
  tailoredResumes: ResumeCardSummary[];
  gapNotes: GapNoteSummary[];
}) {
  const baseTabCount = publicResumes.length + (baseResume ? 1 : 0);

  return (
    <Tabs defaultValue="base">
      <TabsList>
        <TabsIndicator />
        <TabsTab value="base">
          Base{baseTabCount > 0 ? ` (${baseTabCount})` : ""}
        </TabsTab>
        <TabsTab value="tailored">
          Job Tailored{tailoredResumes.length > 0 ? ` (${tailoredResumes.length})` : ""}
        </TabsTab>
      </TabsList>

      <TabsPanel value="base" className="flex flex-col gap-6">
        <BaseResumePanel resume={baseResume} clones={publicResumes} />
        <GapNotesPanel notes={gapNotes} />
      </TabsPanel>
      <TabsPanel value="tailored">
        <TailoredResumesPanel resumes={tailoredResumes} />
      </TabsPanel>
    </Tabs>
  );
}
