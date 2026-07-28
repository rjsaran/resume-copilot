"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getAnalyzeReadinessAction,
  type AnalyzeReadiness,
} from "@/app/analyze-readiness-actions";
import type { JobAnalysis } from "@/types/analysis";

type Phase = "form" | "analyzing" | "result" | "error";

interface AnalyzeState {
  open: boolean;
  phase: Phase;
  jobUrl: string;
  error: string | null;
  analysis: JobAnalysis | null;
  applicationId: string | null;
  jobDescription: string | null;
  cached: boolean;
  readiness: AnalyzeReadiness | null;
  readinessLoading: boolean;
  hasUnseenResult: boolean;
}

interface AnalyzeContextValue extends AnalyzeState {
  openLauncher: () => void;
  closeLauncher: () => void;
  setJobUrl: (url: string) => void;
  submit: (force?: boolean) => void;
  startOver: () => void;
}

const AnalyzeContext = createContext<AnalyzeContextValue | null>(null);

const initialState: AnalyzeState = {
  open: false,
  phase: "form",
  jobUrl: "",
  error: null,
  analysis: null,
  applicationId: null,
  jobDescription: null,
  cached: false,
  readiness: null,
  readinessLoading: false,
  hasUnseenResult: false,
};

/**
 * Owns analysis state at the layout level (not inside the dialog) so a job
 * analysis keeps running - and its result keeps waiting to be viewed - no
 * matter which page the user navigates to while it's in flight. The dialog
 * is just a view over this state; closing it never cancels the underlying
 * fetch.
 */
export function AnalyzeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AnalyzeState>(initialState);
  const requestIdRef = useRef(0);

  const refreshReadiness = useCallback(() => {
    setState((s) => ({ ...s, readinessLoading: s.readiness === null }));
    getAnalyzeReadinessAction()
      .then((readiness) => {
        setState((s) => ({ ...s, readiness, readinessLoading: false }));
      })
      .catch(() => {
        setState((s) => ({ ...s, readinessLoading: false }));
      });
  }, []);

  const openLauncher = useCallback(() => {
    setState((s) => ({
      ...s,
      open: true,
      hasUnseenResult: false,
    }));
    refreshReadiness();
  }, [refreshReadiness]);

  const closeLauncher = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  const setJobUrl = useCallback((jobUrl: string) => {
    setState((s) => ({ ...s, jobUrl }));
  }, []);

  const startOver = useCallback(() => {
    setState((s) => ({
      ...s,
      phase: "form",
      jobUrl: "",
      error: null,
      analysis: null,
      applicationId: null,
      jobDescription: null,
      cached: false,
      hasUnseenResult: false,
    }));
  }, []);

  // Deliberately NOT a setState functional update with the fetch inside it:
  // React (Strict Mode, dev) double-invokes updater functions to catch
  // impurities, which would have fired the request twice. The gating check
  // reads state directly instead, and the fetch lives in the plain callback
  // body below - an event-handler side effect, not a render-path one.
  const submit = useCallback(
    (force = false) => {
      if (!state.jobUrl || state.phase === "analyzing") return;

      const jobUrl = state.jobUrl;
      const requestId = ++requestIdRef.current;
      const params = new URLSearchParams({ url: jobUrl });
      if (force) params.set("force", "true");

      setState((s) => ({ ...s, phase: "analyzing", error: null }));

      // Same split as the old inline form: fetch() throwing means the
      // request never reached the server (offline, DNS, connection
      // refused) - genuinely different from a response coming back that
      // isn't valid JSON (crashed function, proxy/gateway error page).
      // requestIdRef guards against a stale response landing after the
      // user has already started a newer analysis from the dialog.
      (async () => {
        let res: Response;
        try {
          res = await fetch(`/api/analyze?${params.toString()}`);
        } catch {
          if (requestIdRef.current !== requestId) return;
          setState((s2) => ({
            ...s2,
            phase: "error",
            error:
              "Couldn't reach the server. Check your connection and try again.",
            hasUnseenResult: !s2.open,
          }));
          return;
        }

        let data: {
          error?: string;
          analysis?: JobAnalysis;
          applicationId?: string;
          jobDescription?: string;
          cached?: boolean;
        };
        try {
          data = await res.json();
        } catch {
          if (requestIdRef.current !== requestId) return;
          setState((s2) => ({
            ...s2,
            phase: "error",
            error: `The server returned an unexpected response (status ${res.status}). Please try again.`,
            hasUnseenResult: !s2.open,
          }));
          return;
        }

        if (requestIdRef.current !== requestId) return;

        if (!res.ok || !data.analysis) {
          setState((s2) => ({
            ...s2,
            phase: "error",
            error:
              data.error ??
              (res.ok
                ? "The server response was missing the analysis. Please try again."
                : `Something went wrong (status ${res.status}).`),
            hasUnseenResult: !s2.open,
          }));
          return;
        }

        setState((s2) => ({
          ...s2,
          phase: "result",
          analysis: data.analysis ?? null,
          applicationId: data.applicationId ?? null,
          jobDescription: data.jobDescription ?? null,
          cached: Boolean(data.cached),
          error: null,
          hasUnseenResult: !s2.open,
        }));
      })();
    },
    [state.jobUrl, state.phase],
  );

  // Warn before an accidental tab close/refresh while an analysis is still
  // running, since a hard navigation (unlike in-app routing) really would
  // lose it.
  useEffect(() => {
    if (state.phase !== "analyzing") return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state.phase]);

  return (
    <AnalyzeContext.Provider
      value={{
        ...state,
        openLauncher,
        closeLauncher,
        setJobUrl,
        submit,
        startOver,
      }}
    >
      {children}
    </AnalyzeContext.Provider>
  );
}

export function useAnalyze(): AnalyzeContextValue {
  const ctx = useContext(AnalyzeContext);
  if (!ctx) {
    throw new Error("useAnalyze must be used within an AnalyzeProvider");
  }
  return ctx;
}
