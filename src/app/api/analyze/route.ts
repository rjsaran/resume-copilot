import { NextRequest, NextResponse } from "next/server";
import { isJobAnalysis } from "@/types/analysis";
import {
  getApplicationByJobHash,
  hashJobUrl,
  saveAnalysis,
  upsertScrapedJobDescription,
} from "@/lib/repositories/applicationRepository";
import {
  requireBaseResumeData,
  BaseResumeError,
} from "@/lib/repositories/resumeRepository";
import { resumeToPlainText } from "@/lib/resume/text";
import { getUserLlmProvider } from "@/services/llm/userProvider";
import { LLMProviderError } from "@/services/llm/types";
import { analyzeJob, JobAnalysisError } from "@/services/analysis/jobAnalyzer";
import { getCurrentUser } from "@/lib/auth";
import { logger, errorContext } from "@/lib/logger";

const READER_BASE_URL = "https://r.jina.ai/";
const FETCH_TIMEOUT_MS = 15_000;

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const log = logger.child({ route: "/api/analyze", userId: user.id });

  try {
    return await handleAnalyze(request, user, log);
  } catch (error) {
    // Last-resort safety net: every step above already returns its own
    // specific JSON error, so reaching here means something genuinely
    // unanticipated happened (e.g. a DB hiccup on a query that isn't
    // individually wrapped). Without this, an uncaught exception here can
    // surface to the client as a non-JSON error page, which is exactly what
    // turns into the unhelpful catch-all "Failed to reach the analysis
    // service." on the frontend - this guarantees a parseable JSON body
    // instead, even for the case we didn't specifically plan for.
    log.error("Unhandled error in /api/analyze", errorContext(error));
    return NextResponse.json(
      { error: "Something unexpected went wrong. Please try again." },
      { status: 500 },
    );
  }
}

async function handleAnalyze(
  request: NextRequest,
  user: { id: string },
  log: ReturnType<typeof logger.child>,
) {
  const jobUrl = request.nextUrl.searchParams.get("url");
  const forceReanalyze = request.nextUrl.searchParams.get("force") === "true";

  if (!jobUrl) {
    return NextResponse.json(
      { error: "Missing required 'url' query parameter." },
      { status: 400 },
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(jobUrl);
  } catch {
    log.warn("Rejected invalid job URL", { jobUrl });
    return NextResponse.json(
      { error: "'url' must be a valid absolute URL." },
      { status: 400 },
    );
  }

  log.info("Analysis requested", {
    jobHost: parsedUrl.hostname,
    forceReanalyze,
  });

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return NextResponse.json(
      { error: "'url' must use the http or https protocol." },
      { status: 400 },
    );
  }

  let jobResponse: Response;
  try {
    jobResponse = await fetch(`${READER_BASE_URL}${parsedUrl.toString()}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    log.error("Failed to fetch job posting", errorContext(error));
    return NextResponse.json(
      { error: "Failed to reach the job posting URL." },
      { status: 502 },
    );
  }

  if (!jobResponse.ok) {
    log.warn("Job posting fetch returned non-OK status", {
      status: jobResponse.status,
    });
    return NextResponse.json(
      { error: `Job posting fetch failed with status ${jobResponse.status}.` },
      { status: 502 },
    );
  }

  const jobDescription = await jobResponse.text();
  const jobHash = hashJobUrl(parsedUrl.toString());

  // Persist the scrape immediately, before the LLM step - a fetch that cost
  // a real network round-trip to Jina should never be thrown away just
  // because analysis fails afterward (rate limit, bad key, provider
  // outage). Best-effort: never let a failure here block analysis itself.
  try {
    await upsertScrapedJobDescription(user.id, parsedUrl.toString(), jobDescription);
  } catch (error) {
    log.warn("Failed to persist scraped job description", errorContext(error));
  }

  // Skip the LLM call entirely if this exact posting was already analyzed
  // for this user and the scraped text hasn't changed since - the common
  // case of re-opening or re-submitting the same URL. This is a heuristic,
  // not a true cache: it can't detect "the knowledge base changed since
  // last time" (pass ?force=true to bypass it deliberately), and a posting
  // whose page injects dynamic content (ads, "posted Xh ago") on every
  // fetch will never hit it. Still a real, free win against accidental
  // re-analysis of unchanged postings - the thing actually metered on a
  // free-tier LLM key.
  if (!forceReanalyze) {
    const existing = await getApplicationByJobHash(user.id, jobHash);
    if (existing?.analysis && existing.analysis.jdMarkdown === jobDescription) {
      let cachedAnalysis: unknown;
      try {
        cachedAnalysis = JSON.parse(existing.analysis.analysisJson);
      } catch {
        cachedAnalysis = null;
      }
      if (cachedAnalysis && isJobAnalysis(cachedAnalysis)) {
        log.info("Served cached analysis", { applicationId: existing.id });
        return NextResponse.json({
          analysis: cachedAnalysis,
          applicationId: existing.id,
          jobDescription,
          cached: true,
        });
      }
    }
  }

  let careerHistory: string;
  try {
    careerHistory = resumeToPlainText(await requireBaseResumeData(user.id));
  } catch (error) {
    log.warn("Analysis blocked: no base resume", errorContext(error));
    return NextResponse.json(
      {
        error:
          error instanceof BaseResumeError
            ? error.message
            : "Could not read your base resume.",
      },
      { status: error instanceof BaseResumeError ? 400 : 500 },
    );
  }

  let provider;
  try {
    provider = await getUserLlmProvider(user.id);
  } catch (error) {
    log.warn(
      "Analysis blocked: no LLM provider configured",
      errorContext(error),
    );
    return NextResponse.json(
      {
        error:
          error instanceof LLMProviderError
            ? error.message
            : "No LLM provider configured.",
      },
      { status: 400 },
    );
  }

  let analysis;
  try {
    analysis = await analyzeJob({ careerHistory, jobDescription }, provider);
  } catch (error) {
    log.error("Job analysis failed", errorContext(error));
    const message =
      error instanceof JobAnalysisError
        ? error.message
        : "Failed to reach the model.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  let applicationId: string;
  try {
    const application = await saveAnalysis({
      userId: user.id,
      jobUrl: parsedUrl.toString(),
      jdMarkdown: jobDescription,
      analysis,
      model: provider.modelName,
    });
    applicationId = application.id;
  } catch (error) {
    log.error("Analysis succeeded but failed to save", errorContext(error));
    return NextResponse.json(
      { error: "Analysis succeeded but could not be saved to the database." },
      { status: 500 },
    );
  }

  log.info("Analysis completed", {
    applicationId,
    matchScore: analysis.matchScore,
  });

  return NextResponse.json({ analysis, applicationId, jobDescription, cached: false });
}
