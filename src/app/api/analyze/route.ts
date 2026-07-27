import { NextRequest, NextResponse } from "next/server";
import { JOB_ANALYSIS_SCHEMA, isJobAnalysis } from "@/types/analysis";
import { saveAnalysis } from "@/lib/repositories/applicationRepository";
import { requireKnowledgeBase, KnowledgeBaseError } from "@/lib/repositories/knowledgeBaseRepository";
import { careerKnowledgeBaseToText } from "@/lib/resume/careerKnowledgeBaseText";
import { getUserLlmProvider } from "@/services/llm/userProvider";
import { LLMProviderError } from "@/services/llm/types";
import { getCurrentUser } from "@/lib/auth";

const READER_BASE_URL = "https://r.jina.ai/";
const FETCH_TIMEOUT_MS = 15_000;

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const jobUrl = request.nextUrl.searchParams.get("url");

  if (!jobUrl) {
    return NextResponse.json(
      { error: "Missing required 'url' query parameter." },
      { status: 400 }
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(jobUrl);
  } catch {
    return NextResponse.json(
      { error: "'url' must be a valid absolute URL." },
      { status: 400 }
    );
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return NextResponse.json(
      { error: "'url' must use the http or https protocol." },
      { status: 400 }
    );
  }

  let jobResponse: Response;
  try {
    jobResponse = await fetch(`${READER_BASE_URL}${parsedUrl.toString()}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach the job posting URL." },
      { status: 502 }
    );
  }

  if (!jobResponse.ok) {
    return NextResponse.json(
      { error: `Job posting fetch failed with status ${jobResponse.status}.` },
      { status: 502 }
    );
  }

  const jobDescription = await jobResponse.text();

  let careerHistory: string;
  try {
    careerHistory = careerKnowledgeBaseToText(await requireKnowledgeBase(user.id));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof KnowledgeBaseError
            ? error.message
            : "Could not read your career knowledge base.",
      },
      { status: error instanceof KnowledgeBaseError ? 400 : 500 }
    );
  }

  let provider;
  try {
    provider = await getUserLlmProvider(user.id);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof LLMProviderError ? error.message : "No LLM provider configured.",
      },
      { status: 400 }
    );
  }

  let outputText: string;
  try {
    outputText = await provider.generateStructuredJson({
      systemInstruction:
        "You are an engineering recruiter specialized in hiring senior backend engineers.\n\n" +
        "Compare:\n\n" +
        "1. Candidate Career History — a full knowledge base of every job, achievement, project, " +
        "and skill the candidate has. It is deliberately richer than any single resume: a tailored " +
        "resume is built later by selecting and rewording a relevant subset of it for a specific job. " +
        "Do not assume everything here would appear verbatim on a resume.\n" +
        "2. Job Description\n\n" +
        "Return JSON.\n\n" +
        "Never invent experience.\n\n" +
        "Identify:\n\n" +
        "- Company name and job title (extracted from the job description)\n" +
        "- Match score\n" +
        "- ATS score\n" +
        "- Hard blockers\n" +
        "- Resume wording improvements (phrase these as guidance for how a tailored resume built from this history should be worded, not as edits to the career history itself)\n" +
        "- Missing technologies\n" +
        "- Missing domain knowledge\n" +
        "- Resume sections to rewrite\n" +
        "- Interview probability\n" +
        "- Apply / Tailor / Skip",
      input: `# Candidate Career History\n\n${careerHistory}\n\n# Job Description\n\n${jobDescription}`,
      schema: JOB_ANALYSIS_SCHEMA,
    });
  } catch (error) {
    const message = error instanceof LLMProviderError ? error.message : "Failed to reach the model.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    return NextResponse.json(
      { error: "The model did not return valid JSON." },
      { status: 502 }
    );
  }

  if (!isJobAnalysis(parsed)) {
    return NextResponse.json(
      { error: "The model's JSON did not match the expected shape." },
      { status: 502 }
    );
  }

  let applicationId: string;
  try {
    const application = await saveAnalysis({
      userId: user.id,
      jobUrl: parsedUrl.toString(),
      jdMarkdown: jobDescription,
      analysis: parsed,
      model: provider.modelName,
    });
    applicationId = application.id;
  } catch {
    return NextResponse.json(
      { error: "Analysis succeeded but could not be saved to the database." },
      { status: 500 }
    );
  }

  return NextResponse.json({ analysis: parsed, applicationId });
}
