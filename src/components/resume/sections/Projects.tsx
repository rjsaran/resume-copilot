import { SectionTitle } from "@/components/resume/sections/SectionTitle";
import { withScheme } from "@/components/resume/withScheme";
import type { ProjectEntry } from "@/types/resume";
import type { ResumeTheme } from "@/components/resume/themes/types";

export function Projects({
  theme,
  entries,
}: {
  theme: ResumeTheme;
  entries: ProjectEntry[];
}) {
  if (!entries || entries.length === 0) return null;

  const classes = theme.classes.projects;

  return (
    <section className={theme.classes.section.wrapper}>
      <SectionTitle theme={theme}>Projects</SectionTitle>
      {entries.map((project, i) => (
        <article key={`${project.name}-${i}`} className={classes.wrapper}>
          <div className={classes.heading}>
            <span>{project.name}</span>
            {(project.location || project.link) && (
              <span className={classes.meta}>
                {project.location}
                {project.location && project.link && <span aria-hidden> &middot; </span>}
                {project.link && (
                  <a
                    href={withScheme(project.link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={classes.link}
                  >
                    {project.link}
                  </a>
                )}
              </span>
            )}
          </div>
          {project.bullets.length > 0 && (
            <ul className={classes.bullets}>
              {project.bullets.map((bullet, j) => (
                <li key={j} className={classes.bulletItem}>
                  {bullet}
                </li>
              ))}
            </ul>
          )}
          {project.technologies && project.technologies.length > 0 && (
            <p className={classes.technologies}>
              <strong>Technologies:</strong> {project.technologies.join(", ")}
            </p>
          )}
        </article>
      ))}
    </section>
  );
}
