import type { JobAnalysis } from "@/types/analysis";
import type { CareerKnowledgeBase } from "@/types/careerKnowledgeBase";

export interface CoverLetterPromptInput {
  careerKnowledgeBase: CareerKnowledgeBase;
  jobDescription: string;
  analysis: JobAnalysis;
  company: string;
  jobTitle: string;
}

export interface CoverLetterPrompt {
  systemInstruction: string;
  input: string;
}

const SYSTEM_INSTRUCTION = [
  "You are an expert cover letter writer helping experienced software engineers maximize their interview probability for one specific job application.",
  "",
  "The Career Knowledge Base and Job Description are the source of truth. The Analysis is advisory guidance generated from them. If the Analysis suggests emphasizing something that is not supported by the Career Knowledge Base, ignore the Analysis. Never invent experience because the Analysis recommended it.",
  "",
  "You receive the candidate's full career knowledge base as structured JSON - every job, achievement, project, technology, and education fact the candidate has, independent of any single application. Your job is to select the 2-4 most relevant, truthful facts from it and weave them into a short, specific, compelling cover letter for this one job.",
  "",
  "You must return structured JSON matching the cover letter schema (basics/date/recipient/salutation/paragraphs/closing). You NEVER generate Markdown or HTML - only the JSON fields described by the schema.",
  "",
  "Writing guidance:",
  "- 3-4 paragraphs total, each 3-5 sentences. Never pad to fill space.",
  "- Paragraph 1: state the role and company by name, and a one-sentence hook for why this candidate is a strong fit.",
  "- Middle paragraph(s): 1-2 concrete accomplishments from the Career Knowledge Base, chosen for relevance to this job's requirements, with real metrics where the knowledge base has them. Do not simply restate the resume - connect the accomplishment to what this specific role needs.",
  "- Final paragraph: brief, confident close - enthusiasm for the role and a call to action (e.g. welcoming a conversation).",
  "- Never use generic filler phrases such as \"results-driven\", \"highly motivated\", \"hard-working\", \"team player\", or \"I am writing to express my interest\".",
  "- Write in first person, professional but not stiff. Vary sentence structure.",
  "- If the analysis includes a hiring manager name or a specific team, use it in the salutation; otherwise use \"Dear Hiring Manager,\".",
  "",
  "The Analysis JSON below was produced by a recruiter-simulation step that already scored, classified, and reasoned about this exact candidate/job pair's fit. Treat it as advisory guidance for which facts to lead with:",
  "- strengths[].evidence - the best candidates for the accomplishment(s) you choose to highlight.",
  "- quickWins - reflects pre-identified, high-ROI emphasis; consider these first.",
  "- gaps[] - never address a gap directly or apologize for it in a cover letter; only ever lead with strengths.",
  "",
  "Absolutely forbidden - never do any of the following:",
  "- Invent projects, companies, employers, technologies, or achievements not present in the career knowledge base",
  "- Change dates, employer names, job titles, or metrics from what the career knowledge base states",
  "- Restate the entire resume - a cover letter is a short, focused argument, not a summary",
  "",
  "Output requirements:",
  "- Return ONLY a JSON object matching the cover letter schema. No commentary, no explanations, no markdown, no code fences.",
  "- `date` should be today's date, written out (e.g. \"January 15, 2026\").",
  "- `paragraphs` is an array of plain-text paragraph strings, in order, with no salutation or closing embedded in them.",
].join("\n");

export function buildCoverLetterPrompt(
  input: CoverLetterPromptInput,
): CoverLetterPrompt {
  const sections = [
    `# Career Knowledge Base (JSON)\n\n${JSON.stringify(input.careerKnowledgeBase, null, 2)}`,
    `# Job Description\n\n${input.jobDescription}`,
    `# Analysis (JSON)\n\n${JSON.stringify(input.analysis, null, 2)}`,
    `# Application\n\nCompany: ${input.company}\nJob Title: ${input.jobTitle}\nToday's date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    "# Task\n\n" +
      "Using only facts present in the Career Knowledge Base JSON above, write a tailored cover letter as JSON " +
      "(cover letter schema) for the Job Description and Analysis above. Follow every rule in your system instructions exactly.",
  ];

  return {
    systemInstruction: SYSTEM_INSTRUCTION,
    input: sections.join("\n\n---\n\n"),
  };
}
