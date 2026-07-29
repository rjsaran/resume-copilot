"use client";

import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/ui/tabs";
import { BaseResumePanel } from "@/components/resumes/base-resume-panel";
import { PublicResumesPanel } from "@/components/resumes/public-resumes-panel";
import { TailoredResumesPanel } from "@/components/resumes/tailored-resumes-panel";
import type { ResumeCardSummary } from "@/components/resumes/resume-card";

export function ResumesHub({
  baseResume,
  publicResumes,
  tailoredResumes,
}: {
  baseResume: ResumeCardSummary | null;
  publicResumes: ResumeCardSummary[];
  tailoredResumes: ResumeCardSummary[];
}) {
  return (
    <Tabs defaultValue="base">
      <TabsList>
        <TabsTab value="base">Base</TabsTab>
        <TabsTab value="tailored">
          Job Tailored{tailoredResumes.length > 0 ? ` (${tailoredResumes.length})` : ""}
        </TabsTab>
        <TabsTab value="public">
          Public{publicResumes.length > 0 ? ` (${publicResumes.length})` : ""}
        </TabsTab>
      </TabsList>

      <TabsPanel value="base">
        <BaseResumePanel resume={baseResume} />
      </TabsPanel>
      <TabsPanel value="tailored">
        <TailoredResumesPanel resumes={tailoredResumes} />
      </TabsPanel>
      <TabsPanel value="public">
        <PublicResumesPanel resumes={publicResumes} hasBaseResume={Boolean(baseResume)} />
      </TabsPanel>
    </Tabs>
  );
}
