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
  "APPLIED",
  "RECRUITER_CALL",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
]);

export const resumeVersionTypeEnum = pgEnum("resume_version_type", [
  "MASTER",
  "TAILORED",
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
    // "Apply" | "Apply After Tailoring" | "Consider Applying" | "Probably Skip"
    // (analysis.applicationRecommendation.decision). Kept purely for
    // reference; nothing currently sorts/filters on this column.
    applicationDecision: text("application_decision").notNull(),
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
    applicationId: varchar("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: resumeVersionTypeEnum("type").notNull(),
    resumeJson: text("resume_json").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("resume_versions_application_id").on(table.applicationId)],
);

export const resumeVersionsRelations = relations(resumeVersions, ({ one }) => ({
  application: one(applications, {
    fields: [resumeVersions.applicationId],
    references: [applications.id],
  }),
}));

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
 * One row per user: their full career knowledge base as JSON (see
 * types/careerKnowledgeBase.ts). Replaces the old single, file-based
 * resume/career_knowledge_base.json now that the app is multi-user.
 */
export const knowledgeBases = pgTable("knowledge_bases", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  dataJson: text("data_json").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Application = typeof applications.$inferSelect;
export type ApplicationStatus = Application["status"];
export type Analysis = typeof analyses.$inferSelect;
export type ResumeVersion = typeof resumeVersions.$inferSelect;
export type ResumeVersionType = ResumeVersion["type"];
export type Outcome = typeof outcomes.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type LlmProvider = UserSettings["activeProvider"];
export type KnowledgeBaseRow = typeof knowledgeBases.$inferSelect;
