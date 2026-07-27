import type { ExperienceEntry } from "@/types/resume";
import type { ResumeTheme } from "@/components/resume/themes/types";

export function ExperienceItem({
  theme,
  entry,
}: {
  theme: ResumeTheme;
  entry: ExperienceEntry;
}) {
  const classes = theme.classes.experience;

  return (
    <article className={classes.wrapper}>
      <div className={classes.heading}>
        <span className={classes.role}>{entry.role}</span>
        <span className={classes.company}>{entry.company}</span>
      </div>
      <div className={classes.meta}>
        <span>{entry.location}</span>
        <span>
          {entry.startDate} &ndash; {entry.endDate}
        </span>
      </div>
      {entry.bullets.length > 0 && (
        <ul className={classes.bullets}>
          {entry.bullets.map((bullet, i) => (
            <li key={i} className={classes.bulletItem}>
              {bullet}
            </li>
          ))}
        </ul>
      )}
      {entry.technologies && entry.technologies.length > 0 && (
        <p className={classes.technologies}>
          <strong>Technologies:</strong> {entry.technologies.join(", ")}
        </p>
      )}
    </article>
  );
}
