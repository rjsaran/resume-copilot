import { SectionTitle } from "@/components/resume/sections/SectionTitle";
import { ExperienceItem } from "@/components/resume/sections/ExperienceItem";
import type { ExperienceEntry } from "@/types/resume";
import type { ResumeTheme } from "@/components/resume/themes/types";

export function Experience({
  theme,
  entries,
}: {
  theme: ResumeTheme;
  entries: ExperienceEntry[];
}) {
  if (!entries || entries.length === 0) return null;

  return (
    <section className={theme.classes.section.wrapper}>
      <SectionTitle theme={theme}>Experience</SectionTitle>
      {entries.map((entry, i) => (
        <ExperienceItem key={`${entry.company}-${i}`} theme={theme} entry={entry} />
      ))}
    </section>
  );
}
