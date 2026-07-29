import { withScheme } from "@/components/resume/withScheme";
import type { ResumeBasics } from "@/types/resume";
import type { ResumeTheme } from "@/components/resume/themes/types";

export function Header({
  theme,
  basics,
}: {
  theme: ResumeTheme;
  basics: ResumeBasics;
}) {
  const contactItems = [basics.email, basics.phone, basics.location].filter(
    (item): item is string => Boolean(item && item.trim()),
  );
  const linkItems = [basics.linkedin, basics.github, basics.portfolio].filter(
    (item): item is string => Boolean(item && item.trim()),
  );

  return (
    <header className={theme.classes.header.wrapper}>
      <h1 className={theme.classes.header.name}>{basics.name}</h1>
      {basics.title && <p className={theme.classes.header.title}>{basics.title}</p>}
      {contactItems.length > 0 && (
        <div className={theme.classes.header.contactRow}>
          {contactItems.map((item, index) => (
            <span key={item} className={theme.classes.header.contactItem}>
              {index > 0 && <span aria-hidden> &middot; </span>}
              {item}
            </span>
          ))}
        </div>
      )}
      {linkItems.length > 0 && (
        <div className={theme.classes.header.linksRow}>
          {linkItems.map((item, index) => (
            <span key={item} className={theme.classes.header.contactItem}>
              {index > 0 && <span aria-hidden> &middot; </span>}
              <a
                href={withScheme(item)}
                target="_blank"
                rel="noopener noreferrer"
                className={theme.classes.header.link}
              >
                {item}
              </a>
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
