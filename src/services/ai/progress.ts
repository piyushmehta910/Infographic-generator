/** Real-time pipeline progress events streamed to the client over SSE. */
export type PipelinePhaseId = "content" | "blueprint" | "html" | "singleshot" | "finalize";

export type PipelineProgressEvent = {
  type: "phase_start" | "phase_end" | "attempt" | "warning" | "info";
  phase?: PipelinePhaseId;
  status?: "completed" | "fallback" | "failed";
  /** Zero-based HTML refinement attempt number. */
  attempt?: number;
  provider?: string;
  model?: string;
  message?: string;
  elapsedMs?: number;
};
