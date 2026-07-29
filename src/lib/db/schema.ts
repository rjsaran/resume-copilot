import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  timestamp,
  pgEnum,
  varchar,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const applicationStatusEnum = pgEnum("application_status", [
  "ANALYZED",
  "NOT_APPLIED",
  "APPLIED",
  "RECRUITER_CALL",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
]);

/**
 * BASE is the single, rich, uncapped source resume everything else is
 * tailored from - exactly one per user (see the partial unique index on the
 * resumeVersions table). PUBLIC resumes are short, manually-curated resumes
 * for job boards, independent of any application - a user can have any
 * number of them. AI/MANUAL are per-application tailored resumes, also
 * unlimited per application.
 */
export const resumeVersionTypeEnum = pgEnum("resume_version_type", [
  "AI",
  "MANUAL",
  "BASE",
  "PUBLIC",
]);

export const llmProviderEnum = pgEnum("llm_provider", [
  "GEMINI",
  "CLAUDE",
  "OPENAI",
  "OPENROUTER",
]);

export const applications = pgTable(
  "applications",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id").notNull(),
    company: text("company").notNull(),
    jobTitle: text("job_title").notNull(),
    jobUrl: text("job_url").notNull(),
    jobHash: text("job_hash").notNull(),
    status: applicationStatusEnum("status").notNull().default("ANALYZED"),
    overallScore: integer("overall_score").notNull(),
    verdict: text("verdict").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("applications_user_id_job_hash").on(
      table.userId,
      table.jobHash,
    ),
    index("applications_user_id").on(table.userId),
  ],
);

export const applicationsRelations = relations(
  applications,
  ({ one, many }) => ({
    analysis: one(analyses, {
      fields: [applications.id],
      references: [analyses.applicationId],
    }),
    resumeVersions: many(resumeVersions),
    coverLetterVersions: many(coverLetterVersions),
    outcomes: many(outcomes),
  }),
);

export const analyses = pgTable("analyses", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id")
    .notNull()
    .unique()
    .references(() => applications.id, { onDelete: "cascade" }),
  jdMarkdown: text("jd_markdown").notNull(),
  analysisJson: text("analysis_json").notNull(),
  model: text("model").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analysesRelations = relations(analyses, ({ one }) => ({
  application: one(applications, {
    fields: [analyses.applicationId],
    references: [applications.id],
  }),
}));

export const resumeVersions = pgTable(
  "resume_versions",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    // Direct ownership - BASE/PUBLIC rows have no application to derive it
    // from, unlike AI/MANUAL rows which also belong to one.
    userId: text("user_id").notNull(),
    // Null for BASE/PUBLIC; set for AI/MANUAL.
    applicationId: varchar("application_id").references(() => applications.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    type: resumeVersionTypeEnum("type").notNull(),
    resumeJson: text("resume_json").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("resume_versions_application_id").on(table.applicationId),
    index("resume_versions_user_id").on(table.userId),
    // Only BASE is a singleton - a user can have any number of PUBLIC
    // resumes (and any number of AI/MANUAL ones per application).
    uniqueIndex("resume_versions_user_base_unique")
      .on(table.userId)
      .where(sql`${table.type} = 'BASE'`),
  ],
);

export const resumeVersionsRelations = relations(resumeVersions, ({ one }) => ({
  application: one(applications, {
    fields: [resumeVersions.applicationId],
    references: [applications.id],
  }),
}));

/**
 * Unlike resume_versions, there is no type distinction here - a cover letter
 * only ever exists tailored to one specific application, so every row is
 * equivalent in kind and differs only by generation/edit.
 */
export const coverLetterVersions = pgTable(
  "cover_letter_versions",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    applicationId: varchar("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    coverLetterJson: text("cover_letter_json").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("cover_letter_versions_application_id").on(table.applicationId),
  ],
);

export const coverLetterVersionsRelations = relations(
  coverLetterVersions,
  ({ one }) => ({
    application: one(applications, {
      fields: [coverLetterVersions.applicationId],
      references: [applications.id],
    }),
  }),
);

export const outcomes = pgTable(
  "outcomes",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    applicationId: varchar("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    stage: text("stage").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("outcomes_application_id").on(table.applicationId)],
);

export const outcomesRelations = relations(outcomes, ({ one }) => ({
  application: one(applications, {
    fields: [outcomes.applicationId],
    references: [applications.id],
  }),
}));

/**
 * One row per (user, job posting) - the raw scraped text, saved the moment
 * it's fetched, independent of whether the LLM analysis step that follows
 * succeeds. Without this, a scrape that costs a real network round-trip to
 * Jina got thrown away on every LLM failure (rate limit, bad key, provider
 * outage) with nothing to show for it. `applications`/`analyses` still only
 * ever hold a *completed* analysis - company/jobTitle/scores don't exist
 * until the LLM has run, so this can't just be an early, partial insert
 * into those tables.
 */
export const scrapedJobDescriptions = pgTable(
  "scraped_job_descriptions",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id").notNull(),
    jobUrl: text("job_url").notNull(),
    jobHash: text("job_hash").notNull(),
    jdMarkdown: text("jd_markdown").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("scraped_job_descriptions_user_id_job_hash").on(
      table.userId,
      table.jobHash,
    ),
  ],
);

/**
 * One row per Supabase-authenticated user. userId is the Supabase auth
 * user's UUID (auth.users.id) - stored as a plain string since Supabase
 * Auth and this app's data live in separate Postgres databases (Neon vs
 * the Supabase project's own database), so there is no DB-level FK here.
 */
export const userSettings = pgTable("user_settings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  activeProvider: llmProviderEnum("active_provider")
    .notNull()
    .default("GEMINI"),
  encryptedGeminiKey: text("encrypted_gemini_key"),
  encryptedClaudeKey: text("encrypted_claude_key"),
  encryptedOpenAiKey: text("encrypted_openai_key"),
  encryptedOpenRouterKey: text("encrypted_openrouter_key"),
  // Null means "use the provider's default model" - see DEFAULT_MODEL_BY_PROVIDER.
  geminiModel: text("gemini_model"),
  openRouterModel: text("openrouter_model"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Short-lived rows backing PDF/preview export of a resume draft that hasn't
 * been saved as a real ResumeVersion - the render route
 * (/resumes/render/[id]/preview) reads one of these by id instead of a
 * resume_versions row, so Playwright's page-navigation PDF pipeline can be
 * reused unchanged for unsaved content. Each row is deleted right after the
 * PDF is generated (see /api/resume/render/pdf) - this table is not a
 * queue, just a way to hand data to a page navigation without persisting it
 * as a resume.
 */
export const resumeRenderCache = pgTable("resume_render_cache", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  resumeJson: text("resume_json").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Application = typeof applications.$inferSelect;
export type ApplicationStatus = Application["status"];
export type Analysis = typeof analyses.$inferSelect;
export type ResumeVersion = typeof resumeVersions.$inferSelect;
export type ResumeVersionType = ResumeVersion["type"];
export type CoverLetterVersion = typeof coverLetterVersions.$inferSelect;
export type Outcome = typeof outcomes.$inferSelect;
export type ScrapedJobDescription = typeof scrapedJobDescriptions.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type LlmProvider = UserSettings["activeProvider"];
