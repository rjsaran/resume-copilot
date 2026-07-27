import { SectionTitle } from "@/components/resume/sections/SectionTitle";
import type { EducationEntry } from "@/types/resume";
import type { ResumeTheme } from "@/components/resume/themes/types";

export function Education({
  theme,
  entries,
}: {
  theme: ResumeTheme;
  entries: EducationEntry[];
}) {
  if (!entries || entries.length === 0) return null;

  const classes = theme.classes.education;

  return (
    <section className={theme.classes.section.wrapper}>
      <SectionTitle theme={theme}>Education</SectionTitle>
      {entries.map((entry, i) => {
        const dateRange = [entry.startDate, entry.endDate].filter(Boolean).join(" – ");
        const metaParts = [dateRange, entry.location, entry.gpa ? `GPA: ${entry.gpa}` : ""]
          .filter(Boolean)
          .join(" | ");

        return (
          <div key={`${entry.institution}-${i}`} className={classes.wrapper}>
            <div className={classes.heading}>
              <span>{entry.degree}</span>
              <span>{entry.institution}</span>
            </div>
            {metaParts && <p className={classes.meta}>{metaParts}</p>}
            {entry.notes && entry.notes.length > 0 && (
              <ul className={classes.notes}>
                {entry.notes.map((note, j) => (
                  <li key={j}>{note}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}
