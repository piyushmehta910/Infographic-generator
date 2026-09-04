"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Loader2, Settings, Sparkles, LayoutDashboard, X, PenLine, Square } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import InputPanel from "@/components/generate/InputPanel";
import CanvasView from "@/components/generate/CanvasView";
import ProviderSettings from "@/components/generate/ProviderSettings";
import Toast from "@/components/ui/Toast";
import { useEditorStore } from "@/stores/editorStore";
import { useAIStore } from "@/stores/aiStore";
import { useUIStore } from "@/stores/uiStore";
import { APP_NAME } from "@/lib/site";
import { ASPECT_RATIOS } from "@/lib/constants";
import {
  AspectRatio,
  AspectRatioId,
  FontId,
  AIGenerationRequest,
  AIGenerationResult,
  ChatMessage,
  GenerationRevision,
} from "@/lib/types";
import type { MemoryEntry } from "@/services/ai/memory";
import type { PipelineProgressEvent } from "@/services/ai/progress";
import {
  saveProject,
  loadProject,
  newProjectId,
  newRevisionId,
  Project,
} from "@/lib/editor/persistence";
import { getAIMemory, saveAIMemory } from "@/lib/storage/memoryDb";

function formatElapsed(ms: number): string {
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rs = Math.round(s % 60);
  return `${m}:${rs.toString().padStart(2, "0")}`;
}

/** Map raw error text to a user-friendly one-line message. */
function friendlyErrorMessage(raw: string, errorType?: string): string {
  const lower = raw.toLowerCase();
  if (errorType === "auth_failed" || /api.?key|unauthorized|401|403/i.test(lower))
    return "Your API key was rejected. Open Settings and check it's correct.";
  if (errorType === "rate_limit" || /429|rate.?limit|quota|too many/i.test(lower))
    return "Too many requests — wait a minute and try again.";
  if (errorType === "timeout" || /timeout|timed.?out|abort|cancel/i.test(lower))
    return "The AI took too long to respond. Try a faster model or try again.";
  if (errorType === "invalid_request" || /context.?length|max.?tokens|400|invalid/i.test(lower))
    return "Your input is too long for this model. Shorten it and try again.";
  if (/connection.?drop|stream.?end|connection.*without/i.test(lower))
    return "The connection dropped before generation finished — the AI providers were too slow. Try again, or pick a faster model.";
  if (/invalid design|could not be refined/i.test(lower))
    return "The AI produced a design that didn't meet quality standards. Try again — a different model may help.";
  if (/endpoint.*error|internal.?server|upstream/i.test(lower))
    return "Something went wrong on the server. Try again in a moment.";
  if (/provider.?call|no response|empty/i.test(lower))
    return "The AI provider returned no output. Try a different provider in Settings.";
  return raw.length > 120 ? raw.slice(0, 117) + "…" : raw;
}

/** Map a pipeline progress event to a human progress label. */
function labelForEvent(e: PipelineProgressEvent): string | null {
  switch (e.type) {
    case "phase_start":
      if (e.phase === "content") return "Phase 1: Polishing content & expanding topic…";
      if (e.phase === "blueprint") return "Phase 2: Designing custom visual layout…";
      if (e.phase === "html") return "Phase 3: Coding combined HTML & CSS infographic…";
      return null;
    case "attempt":
      return `Refining visual design (attempt ${(e.attempt ?? 0) + 1})…`;
    case "info":
      if (e.phase === "singleshot") return "Trying a one-shot generation…";
      return e.message || null;
    case "warning":
      return e.message || null;
    default:
      return null;
  }
}

/** Parse an SSE body and dispatch (event, data) pairs. Returns frames seen. */
async function consumeSSE(
  response: Response,
  onEvent: (event: string, data: any) => void,
): Promise<number> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let frames = 0;
  const dispatch = (raw: string) => {
    let eventName = "message";
    const dataLines: string[] = [];
    for (const line of raw.split("\n")) {
      if (line.startsWith("event:")) eventName = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
    }
    if (!dataLines.length) return;
    frames++;
    try {
      onEvent(eventName, JSON.parse(dataLines.join("\n")));
    } catch {
      /* skip malformed frame */
    }
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      dispatch(raw);
    }
  }
  // A final frame without its trailing blank line must not be lost.
  if (buffer.trim()) dispatch(buffer);
  return frames;
}

export default function GeneratePage() {
  const {
    content,
    setContent,
    setGenerating,
    setGenerationContext,
    messages,
    revisions,
    currentRevisionId,
    addMessage,
    setMessages,
    addRevision,
    setRevisions,
    setCurrentRevisionId,
  } = useEditorStore();
  const { showToast } = useUIStore();
  const providers = useAIStore((s) => s.providers);
  const activeConfig = useAIStore((s) => s.getActiveConfig());
  const generatingRef = useRef(false);
  const startTimeRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  // Working-memory carried across generations in this session
  const memoryRef = useRef<MemoryEntry[]>([]);

  // Check if any provider has an API key configured
  const hasApiKey = providers.some((p) => p.apiKey && p.apiKey.trim().length > 0);

  const [input, setInput] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(ASPECT_RATIOS["1:1"]);
  const [designIntent, setDesignIntent] = useState("auto");
  const [zoom, setZoom] = useState(100);
  const [html, setHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressLabel, setProgressLabel] = useState<string>("Starting…");
  const [elapsed, setElapsed] = useState(0);
  const [genError, setGenError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  // Mobile: content input opens as an overlay drawer (< md).
  const [mobileInputOpen, setMobileInputOpen] = useState(false);

  // Project persistence
  const projectIdRef = useRef<string | null>(null);
  const projectCreatedAtRef = useRef(0);

  const genInputType: AIGenerationRequest["inputType"] = "text";
  const requestInput = input;
  const hasContent = Boolean(requestInput) && requestInput.trim().length > 0;

  const persistProject = useCallback(
    async (htmlOverride?: string, newRev?: GenerationRevision, newMsg?: ChatMessage) => {
      const targetHtml = htmlOverride ?? html;
      if (!targetHtml) return;
      const id = projectIdRef.current ?? newProjectId();
      projectIdRef.current = id;
      projectCreatedAtRef.current = projectCreatedAtRef.current || Date.now();
      const updatedRevisions = newRev ? [...revisions, newRev] : revisions;
      const updatedMessages = newMsg ? [...messages, newMsg] : messages;
      const project: Project = {
        id,
        title: (requestInput || "Untitled infographic").slice(0, 80),
        createdAt: projectCreatedAtRef.current,
        updatedAt: Date.now(),
        input: {
          mode: "text",
          content: requestInput.slice(0, 8000),
        },
        aspectRatio: aspectRatio.id,
        aspectRatioWidth: aspectRatio.width,
        aspectRatioHeight: aspectRatio.height,
        phase1_content: newRev?.content ?? content,
        phase2_blueprint: newRev?.blueprint ?? null,
        phase3_html: targetHtml,
        thumbnail: "",
        messages: updatedMessages,
        revisions: updatedRevisions,
        activeRevisionId: newRev?.revisionId ?? currentRevisionId ?? undefined,
      };
      await saveProject(project);
    },
    [html, requestInput, aspectRatio, revisions, messages, currentRevisionId, content],
  );

  // Load an existing project via ?id=…
  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      if (!id) return;
      const project = await loadProject(id);
      if (!project) return;
      setHtml(project.phase3_html);
      memoryRef.current = [];
      setInput(project.input.content || "");
      setAspectRatio(ASPECT_RATIOS[(project.aspectRatio as AspectRatioId)] || ASPECT_RATIOS["1:1"]);
      projectIdRef.current = project.id;
      projectCreatedAtRef.current = project.createdAt;
      if (project.messages && project.messages.length > 0) {
        setMessages(project.messages);
      }
      if (project.revisions && project.revisions.length > 0) {
        setRevisions(project.revisions);
        setCurrentRevisionId(project.activeRevisionId || project.revisions[project.revisions.length - 1].revisionId);
      }
    })();
  }, [setMessages, setRevisions, setCurrentRevisionId]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const executeGeneration = useCallback(
    async (refinementText?: string) => {
      if (generatingRef.current) {
        showToast({ type: "info", title: "Already generating", message: "One generation at a time — please wait." });
        return;
      }
      if (!hasContent && !refinementText) {
        showToast({ type: "error", title: "Input required", message: "Please provide some content before generating." });
        return;
      }
      if (!hasApiKey) {
        showToast({
          type: "error",
          title: "API Key Required",
          message: "Please add an API key in Settings first. Free tiers available for all providers.",
        });
        setShowSettings(true);
        return;
      }

      if (!projectIdRef.current) projectIdRef.current = newProjectId();
      const memKey = projectIdRef.current;
      try {
        const persisted = await getAIMemory(memKey);
        if (persisted.length) memoryRef.current = persisted;
      } catch {
        // ignore errors loading memory
      }

      const isRefine = Boolean(refinementText);
      const request: AIGenerationRequest = {
        input: isRefine ? (refinementText || "") : requestInput,
        inputType: genInputType,
        aspectRatio: aspectRatio.id as AspectRatioId,
        aspectRatioWidth: aspectRatio.width,
        aspectRatioHeight: aspectRatio.height,
        font: "inter" as FontId,
        language: "en",
        audience: "general",
        userIntent: designIntent === "auto" ? undefined : designIntent,
        chatHistory: messages,
        refinementPrompt: refinementText,
        previousContent: content ?? undefined,
        previousHtml: html ?? undefined,
      };

      generatingRef.current = true;
      setIsGenerating(true);
      setGenError(null);
      setProgressLabel(isRefine ? "Refining design…" : "Starting…");
      startTimeRef.current = Date.now();
      setElapsed(0);
      setGenerating(true);

      const tv = setInterval(() => setElapsed(Date.now() - startTimeRef.current), 250);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            request,
            options: {
              apiKey: activeConfig?.apiKey ?? "",
              providerId: activeConfig?.id ?? "openrouter",
              model: activeConfig?.model ?? "",
              temperature: activeConfig?.temperature ?? 0.5,
              maxTokens: activeConfig?.maxTokens ?? 2048,
              storedProviders: providers.map((p) => ({
                id: p.id,
                apiKey: p.apiKey,
                model: p.model,
                baseUrl: p.baseUrl,
              })),
              memory: memoryRef.current,
            },
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          let serverError = "Generation endpoint error.";
          try {
            const data = await response.json();
            serverError = data?.error || serverError;
          } catch {
            /* ignore */
          }
          throw new Error(serverError);
        }

        let res: AIGenerationResult | null = null;
        const frames = await consumeSSE(response, (event, data) => {
          if (event === "progress") {
            const label = labelForEvent(data as PipelineProgressEvent);
            if (label) setProgressLabel(label);
          } else if (event === "result") {
            res = data as AIGenerationResult;
          }
        });

        if (!res) {
          throw new Error(
            frames > 0
              ? "The connection dropped before generation finished. Try again, or pick a faster model."
              : "The generation endpoint closed the connection without doing any work. Check your connection and try again.",
          );
        }
        const result = res as AIGenerationResult;

        if (result.success && result.generatedHtml) {
          setHtml(result.generatedHtml);
          if (result.content) setContent(result.content);
          setGenerationContext({
            request,
            content: result.content ?? null,
            blueprint: result.blueprint ?? null,
            html: result.generatedHtml,
            provider: result.provider,
            model: result.model,
            steps: result.steps,
            processingTime: result.processingTime,
            usedFallback: result.usedFallback,
            createdAt: Date.now(),
          });

          const revId = newRevisionId();
          const newRev: GenerationRevision = {
            revisionId: revId,
            timestamp: Date.now(),
            prompt: isRefine ? (refinementText || "Refinement") : (requestInput.slice(0, 50) || "Initial Design"),
            content: result.content ?? content ?? null,
            blueprint: result.blueprint ?? null,
            html: result.generatedHtml,
            aspectRatio: aspectRatio.id,
            label: `v${revisions.length + 1}`,
          };
          addRevision(newRev);

          const aiMsg: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            role: "assistant",
            content: isRefine
              ? `I've updated the infographic based on your edit: "${refinementText}".`
              : `I've created your infographic with ${result.content?.sections?.length || 4} structured sections and ${result.content?.statistics?.length || 3} key statistics. Ask me anytime in chat to edit colors, text, or layout!`,
            timestamp: Date.now(),
            revisionId: revId,
          };
          addMessage(aiMsg);

          const totalMs = result.processingTime ?? (Date.now() - startTimeRef.current);
          const warningNote =
            result.warnings && result.warnings.length > 0 ? result.warnings[0] : undefined;
          showToast({
            type: warningNote ? "warning" : "success",
            title: warningNote ? "Infographic ready (with notes)" : "Infographic ready!",
            message: warningNote
              ? `${warningNote} (${formatElapsed(totalMs)})`
              : `Completed in ${formatElapsed(totalMs)} across ${result.steps?.length ?? 4} phases.`,
          });

          memoryRef.current = result.memory ?? memoryRef.current;
          await saveAIMemory(projectIdRef.current ?? "temp", result.memory ?? []);
          persistProject(result.generatedHtml, newRev, aiMsg);
        } else {
          memoryRef.current = result.memory ?? memoryRef.current;
          await saveAIMemory(projectIdRef.current ?? "temp", result.memory ?? []);
          const failedStep =
            result.steps?.find((s) => s.status === "failed")?.name ||
            (result.steps?.length ? "setup" : "provider call");
          const friendly = friendlyErrorMessage(result.error || "Please try again.", result.errorType);
          const detail = result.provider ? `${result.provider}/${result.model ?? "?"} — ${failedStep}` : "";
          console.error("Generation failed", { provider: result.provider, model: result.model, error: result.error, steps: result.steps });
          setGenError(friendly);
          showToast({
            type: "error",
            title: "Generation failed",
            message: friendly + (detail ? `\n${detail}` : ""),
            duration: 10000,
          });
        }
      } catch (e: any) {
        if (e?.name === "AbortError") {
          showToast({ type: "info", title: "Generation cancelled", message: "No further provider calls were made." });
        } else {
          const raw = e?.message || "Please try again.";
          const friendly = friendlyErrorMessage(raw);
          setGenError(friendly);
          showToast({
            type: "error",
            title: "Generation failed",
            message: friendly,
            duration: 10000,
          });
        }
      } finally {
        clearInterval(tv);
        generatingRef.current = false;
        setIsGenerating(false);
        abortRef.current = null;
        setGenerating(false);
      }
    },
    [
      requestInput,
      genInputType,
      aspectRatio,
      designIntent,
      activeConfig,
      providers,
      hasContent,
      messages,
      content,
      html,
      revisions,
      setContent,
      setGenerating,
      setGenerationContext,
      addRevision,
      addMessage,
      showToast,
      persistProject,
    ],
  );

  const handleGenerate = useCallback(() => {
    executeGeneration();
  }, [executeGeneration]);

  const handleSelectRevision = useCallback(
    (rev: GenerationRevision) => {
      setHtml(rev.html);
      if (rev.content) setContent(rev.content);
      setCurrentRevisionId(rev.revisionId);
      const ar = ASPECT_RATIOS[(rev.aspectRatio as AspectRatioId)];
      if (ar) setAspectRatio(ar);
      showToast({
        type: "info",
        title: `Switched to ${rev.label || "revision"}`,
        message: rev.prompt,
      });
    },
    [setContent, setCurrentRevisionId, setAspectRatio, showToast],
  );

  const handleExport = useCallback(
    async (format: "png" | "jpg" | "pdf" | "svg" | "json") => {
      if (!html) return;
      let el: HTMLElement | null = null;
      try {
        if (format === "json") {
          const blob = new Blob([JSON.stringify({ html }, null, 2)], { type: "application/json" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "infographic.json";
          a.click();
          showToast({ type: "success", title: "Exported as JSON" });
          return;
        }
        // The live preview lives inside an iframe, which html-to-image cannot
        // rasterize — re-render the same HTML inline offscreen for the capture.
        const { renderOffscreenForCapture } = await import("@/lib/export/capture");
        el = await renderOffscreenForCapture(html, aspectRatio.width, aspectRatio.height);
        const mod = await import("html-to-image");
        const fn = format === "jpg" ? mod.toJpeg : format === "svg" ? mod.toSvg : mod.toPng;
        const dataUrl = await fn(el, {
          quality: 1,
          pixelRatio: 2,
          ...(format === "jpg" ? { backgroundColor: "#ffffff" } : {}),
        });
        if (format === "pdf") {
          const { jsPDF } = await import("jspdf");
          const pdf = new jsPDF({
            orientation: aspectRatio.width > aspectRatio.height ? "landscape" : "portrait",
            unit: "px",
            format: [aspectRatio.width, aspectRatio.height],
          });
          pdf.addImage(dataUrl, "PNG", 0, 0, aspectRatio.width, aspectRatio.height);
          pdf.save("infographic.pdf");
        } else {
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `infographic.${format}`;
          a.click();
        }
        showToast({ type: "success", title: `Exported as ${format.toUpperCase()}` });
      } catch (e) {
        showToast({
          type: "error",
          title: "Export failed",
          message: e instanceof Error && e.message ? e.message.slice(0, 200) : "Please try again.",
          duration: 8000,
        });
      } finally {
        el?.remove();
      }
    },
    [html, aspectRatio, showToast],
  );

  return (
    <>
      <Toast />
      <div className="flex h-screen overflow-hidden bg-navy-950 text-surface-100 font-body relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 right-1/4 w-[480px] h-[480px] rounded-full bg-brand-500/10 blur-[130px]" />
          <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-emerald-500/8 blur-[120px]" />
        </div>
        <div className="relative z-10 flex h-full w-full">
        {/* Desktop sidebar input */}
        <div className="hidden md:flex h-full">
          <InputPanel
            input={input}
            setInput={setInput}
            onGenerateClick={handleGenerate}
            isGenerating={isGenerating}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            designIntent={designIntent}
            setDesignIntent={setDesignIntent}
            onOpenSettings={() => setShowSettings(true)}
            hasApiKey={hasApiKey}
            hasExistingHtml={Boolean(html)}
          />
        </div>
        {/* Mobile drawer input */}
        <AnimatePresence>
          {mobileInputOpen && (
            <div className="md:hidden fixed inset-0 z-50">
              <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setMobileInputOpen(false)}
              />
              <motion.div
                className="absolute inset-y-0 left-0 flex shadow-2xl"
                initial={{ x: -360 }}
                animate={{ x: 0 }}
                exit={{ x: -360 }}
                transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
              >
                <InputPanel
                  input={input}
                  setInput={setInput}
                  onGenerateClick={() => {
                    setMobileInputOpen(false);
                    handleGenerate();
                  }}
                  isGenerating={isGenerating}
                  aspectRatio={aspectRatio}
                  setAspectRatio={setAspectRatio}
                  designIntent={designIntent}
                  setDesignIntent={setDesignIntent}
                  onOpenSettings={() => setShowSettings(true)}
                  hasApiKey={hasApiKey}
                  hasExistingHtml={Boolean(html)}
                />
                <button
                  onClick={() => setMobileInputOpen(false)}
                  aria-label="Close content panel"
                  className="self-start m-2 p-2 rounded-lg bg-surface-800/80 text-surface-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <header className="h-14 border-b border-white/5 px-3 sm:px-4 flex items-center justify-between bg-surface-900/60 backdrop-blur-xl">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-lg shadow-brand-900/40 transition-transform group-hover:scale-105">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-baseline gap-2">
                <h1 className="font-display font-semibold text-white leading-tight">{APP_NAME}</h1>
                <span className="hidden sm:inline text-[11px] text-surface-400 uppercase tracking-wider">Creator</span>
              </div>
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              {isGenerating && (
                <>
                  {/* Real per-phase progress streamed from the pipeline — visible on mobile too. */}
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-surface-300 min-w-0">
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    <span className="truncate max-w-[9rem] sm:max-w-[16rem]" aria-live="polite">{progressLabel}</span>
                    <span className="tabular-nums text-surface-500">{formatElapsed(elapsed)}</span>
                  </div>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-red-400/40 text-red-300 hover:bg-red-500/10 transition-all flex-shrink-0"
                    title="Cancel this generation"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span className="hidden sm:inline">Cancel</span>
                  </button>
                </>
              )}
              {!isGenerating && (
                <button
                  onClick={() => setMobileInputOpen(true)}
                  aria-label="Edit content"
                  className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-brand-gradient text-white"
                >
                  <PenLine className="w-4 h-4" /> Content
                </button>
              )}
              <Link
                href="/dashboard"
                aria-label="Your projects"
                title="Your projects"
                className="p-2 hover:bg-white/5 rounded-lg text-surface-300 hover:text-white flex-shrink-0"
              >
                <LayoutDashboard className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setShowSettings(true)}
                aria-label="Open settings"
                className="p-2 hover:bg-white/5 rounded-lg text-surface-300 hover:text-white flex-shrink-0"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </header>
          <CanvasView
            html={html}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            zoom={zoom}
            setZoom={setZoom}
            onExport={handleExport}
            onRegenerate={handleGenerate}
            isGenerating={isGenerating}
            hasContent={hasContent}
            progress={{ label: progressLabel, elapsed: formatElapsed(elapsed) }}
            onCancel={handleCancel}
            error={genError}
            onRetry={handleGenerate}
            revisions={revisions}
            currentRevisionId={currentRevisionId}
            onSelectRevision={handleSelectRevision}
          />
        </div>
        </div>
      </div>
      <ProviderSettings open={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
