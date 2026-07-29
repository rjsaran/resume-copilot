import "@/components/resume/resume-print.css";
import { resumeFont } from "@/components/resume/fonts";
import {
  resolveResumeTheme,
  type ResumeThemeId,
} from "@/components/resume/themes";
import { Header } from "@/components/resume/sections/Header";
import { Summary } from "@/components/resume/sections/Summary";
import { Experience } from "@/components/resume/sections/Experience";
import { Projects } from "@/components/resume/sections/Projects";
import { Skills } from "@/components/resume/sections/Skills";
import { Education } from "@/components/resume/sections/Education";
import { filterVisibleResumeData } from "@/lib/resume/visibility";
import { cn } from "@/lib/utils";
import type { ResumeData } from "@/types/resume";

/**
 * The rendering engine's single entry point. Every section receives plain
 * ResumeData - no Markdown parsing anywhere in this tree. Swapping `theme`
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
  const visible = filterVisibleResumeData(data);

  return (
    <div className={cn(theme.classes.page, resumeFont.className, className)}>
      <Header theme={theme} basics={visible.basics} />
      <Summary theme={theme} summary={visible.basics.summary} />
      <Experience theme={theme} entries={visible.experience} />
      <Projects theme={theme} entries={visible.projects} />
      <Skills theme={theme} skills={visible.skills} />
      <Education theme={theme} entries={visible.education} />
    </div>
  );
}
