import { SectionTitle } from "@/components/resume/sections/SectionTitle";
import type { ResumeTheme } from "@/components/resume/themes/types";

export function Summary({
  theme,
  summary,
}: {
  theme: ResumeTheme;
  summary: string;
}) {
  if (!summary || !summary.trim()) return null;

  return (
    <section className={theme.classes.section.wrapper}>
      <SectionTitle theme={theme}>Summary</SectionTitle>
      <p className={theme.classes.summary}>{summary}</p>
    </section>
  );
}
