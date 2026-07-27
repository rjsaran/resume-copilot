export interface KnowledgeBaseImportPromptInput {
  /** Raw text extracted from an uploaded resume PDF. */
  sourceText: string;
}

export interface KnowledgeBaseImportPrompt {
  systemInstruction: string;
  input: string;
}

const SYSTEM_INSTRUCTION = [
  "You are transcribing a candidate's career history from raw text extracted from a resume PDF " +
    "(extraction can leave layout artifacts: odd line breaks, column text interleaved, repeated headers/footers) " +
    "into a structured career knowledge base as JSON.",
  "",
  "The knowledge base is a full history — every job, project, skill, and education fact the candidate has " +
    "— not a resume. It is later used as the source material a separate tailoring step selects and rewords " +
    "a subset of for any given job application. Your only job here is faithful transcription and structuring, " +
    "not tailoring, summarizing, or trimming.",
  "",
  "Rules:",
  "- Extract every distinct fact from the source text: every role, every project, every achievement/bullet, " +
    "every skill or technology mentioned, every education entry.",
  "- Never invent, infer, or embellish anything not stated or clearly implied by the source text. If a field " +
    "(e.g. an end date, GPA, or location) isn't present, omit it rather than guessing.",
  "- One fact per achievement/highlight string — split run-on bullets into separate entries rather than " +
    "concatenating multiple facts into one string.",
  "- Assign each experience, project, and education entry a short, stable, kebab-case `id` derived from its " +
    "name (e.g. \"acme-corp-senior-engineer\", \"personal-site-redesign\").",
  "- Group technologies/skills into sensible categories (e.g. \"Languages\", \"Frameworks\", \"Cloud\", " +
    "\"Databases\", \"Tools\") based only on what the source text actually lists — do not add skills that " +
    "aren't evidenced anywhere in the source text.",
  "- If the source text has no clear personal summary, omit it rather than fabricating one.",
  "",
  "Output requirements:",
  "- Return ONLY a JSON object matching the knowledge base schema. No commentary, no explanations, no " +
    "markdown, no code fences.",
].join("\n");

export function buildKnowledgeBaseImportPrompt(
  input: KnowledgeBaseImportPromptInput
): KnowledgeBaseImportPrompt {
  return {
    systemInstruction: SYSTEM_INSTRUCTION,
    input: `# Source Text\n\n${input.sourceText}\n\n---\n\n# Task\n\nTranscribe the source text above into the career knowledge base JSON schema, following every rule in your system instructions exactly.`,
  };
}
