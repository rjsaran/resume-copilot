export interface ResumeTheme {
  id: string;
  label: string;
  classes: {
    page: string;
    header: {
      wrapper: string;
      name: string;
      title: string;
      contactRow: string;
      contactItem: string;
    };
    section: {
      wrapper: string;
      title: string;
    };
    divider: string;
    summary: string;
    experience: {
      wrapper: string;
      heading: string;
      role: string;
      company: string;
      meta: string;
      bullets: string;
      bulletItem: string;
      technologies: string;
    };
    projects: {
      wrapper: string;
      heading: string;
      meta: string;
      bullets: string;
      bulletItem: string;
      technologies: string;
    };
    skills: {
      wrapper: string;
      category: string;
      categoryLabel: string;
      categoryValues: string;
    };
    education: {
      wrapper: string;
      heading: string;
      meta: string;
      notes: string;
    };
  };
}
