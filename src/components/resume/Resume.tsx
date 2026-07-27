import "@/components/resume/resume-print.css";
import { resumeFont } from "@/components/resume/fonts";
import { resolveResumeTheme, type ResumeThemeId } from "@/components/resume/themes";
import { Header } from "@/components/resume/sections/Header";
import { Summary } from "@/components/resume/sections/Summary";
import { Experience } from "@/components/resume/sections/Experience";
import { Projects } from "@/components/resume/sections/Projects";
import { Skills } from "@/components/resume/sections/Skills";
import { Education } from "@/components/resume/sections/Education";
import { Divider } from "@/components/resume/sections/Divider";
import { cn } from "@/lib/utils";
import type { ResumeData } from "@/types/resume";

/**
 * The rendering engine's single entry point. Every section receives plain
 * ResumeData — no Markdown parsing anywhere in this tree. Swapping `theme`
 * changes the entire visual design without touching the data or the AI
 * pipeline that produced it.
 */
export function Resume({
  data,
  theme: themeId,
  className,
}: {
  data: ResumeData;
  theme?: ResumeThemeId | string;
  className?: string;
}) {
  const theme = resolveResumeTheme(themeId);

  return (
    <div className={cn(theme.classes.page, resumeFont.className, className)}>
      <Header theme={theme} basics={data.basics} />
      <Divider theme={theme} />
      <Summary theme={theme} summary={data.basics.summary} />
      <Experience theme={theme} entries={data.experience} />
      <Projects theme={theme} entries={data.projects} />
      <Skills theme={theme} skills={data.skills} />
      <Education theme={theme} entries={data.education} />
    </div>
  );
}
