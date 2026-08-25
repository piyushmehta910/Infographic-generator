"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Loader2, Settings, Sparkles, LayoutDashboard, X, PenLine } from "lucide-react";
import InputPanel from "@/components/generate/InputPanel";
import CanvasView from "@/components/generate/CanvasView";
import StylePanel from "@/components/generate/StylePanel";
import ProviderSettings from "@/components/generate/ProviderSettings";
import Toast from "@/components/ui/Toast";
import { useEditorStore } from "@/stores/editorStore";
import { useAIStore } from "@/stores/aiStore";
import { useUIStore } from "@/stores/uiStore";
import { APP_NAME } from "@/lib/site";
import { ASPECT_RATIOS } from "@/lib/constants";
import { AspectRatio, AspectRatioId, FontId, AIGenerationRequest, AIGenerationResult } from "@/lib/types";
import type { MemoryEntry } from "@/services/ai/memory";
import { saveProject, loadProject, newProjectId, Project } from "@/lib/editor/persistence";
import { getAIMemory, saveAIMemory, clearAIMemory } from "@/lib/storage/memoryDb";

const LOADING_STEPS = [
  "Analyzing your content…",
  "Structuring data…",
  "Designing layout…",
  "Rendering…",
];

function formatElapsed(ms: number): string {
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rs = Math.round(s % 60);
  return `${m}:${rs.toString().padStart(2, "0")}`;
}

export default function GeneratePage() {
  const { setContent, setGenerating, setGenerationContext } = useEditorStore();
  const { showToast } = useUIStore();
  const providers = useAIStore((s) => s.providers);
  const activeConfig = useAIStore((s) => s.getActiveConfig());
  const generatingRef = useRef(false);
  const startTimeRef = useRef(0);
  // Small working-memory carried across generations in this session: the
  // server distills each run into facts/decisions, and the next generation
  // re-seeds with it so the AI stays consistent (e.g. "regenerate, new theme").
  const memoryRef = useRef<MemoryEntry[]>([]);

  const [input, setInput] = useState("");
   const [aspectRatio, setAspectRatio] = useState<AspectRatio>(ASPECT_RATIOS["1:1"]);
   const [zoom, setZoom] = useState(100);
   const [html, setHtml] = useState<string | null>(null);
   const [isGenerating, setIsGenerating] = useState(false);
   const [step, setStep] = useState(0);
   const [elapsed, setElapsed] = useState(0);
   const [showSettings, setShowSettings] = useState(false);
   // Mobile: content input opens as an overlay drawer (< md).
   const [mobileInputOpen, setMobileInputOpen] = useState(false);

  // Project persistence
  const projectIdRef = useRef<string | null>(null);
  const projectCreatedAtRef = useRef(0);

   const genInputType: AIGenerationRequest["inputType"] = "text";
   const requestInput = input;
   const hasContent = Boolean(requestInput) && requestInput.trim().length > 0;

   const persistProject = useCallback(async () => {
     if (!html) return;
     const id = projectIdRef.current ?? newProjectId();
     projectIdRef.current = id;
     projectCreatedAtRef.current = projectCreatedAtRef.current || Date.now();
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
        phase1_content: null,
        phase2_blueprint: null,
        phase3_html: html,
        thumbnail: "",
     };
     await saveProject(project);
    }, [html, requestInput, aspectRatio]);

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
    })();
  }, []);

  const handleGenerate = useCallback(async () => {
    if (generatingRef.current) {
      showToast({ type: "info", title: "Already generating", message: "One generation at a time — please wait." });
      return;
    }
    if (!hasContent) {
      showToast({ type: "error", title: "Input required", message: "Please provide some content before generating." });
      return;
    }
    // Assign the project id up front so AI memory and the saved project
    // always share the same key (previously first-run memory landed under
    // a "temp" key and was lost after reload).
    if (!projectIdRef.current) projectIdRef.current = newProjectId();
    const memKey = projectIdRef.current;
    try {
      const persisted = await getAIMemory(memKey);
      if (persisted.length) memoryRef.current = persisted;
    } catch {
      // ignore any errors loading memory
    }
     await clearAIMemory(memKey);
      const request: AIGenerationRequest = {
        input: requestInput,
        inputType: genInputType,
         aspectRatio: aspectRatio.id as AspectRatioId,
         aspectRatioWidth: aspectRatio.width,
         aspectRatioHeight: aspectRatio.height,
        font: "inter" as FontId,
        language: "en",
        audience: "general",
      };
     generatingRef.current = true;
     setIsGenerating(true);
     setHtml(null);
     setStep(0);
     setElapsed(0);
     startTimeRef.current = Date.now();
    setGenerating(true);
    const iv = setInterval(() => setStep((s) => (s + 1) % LOADING_STEPS.length), 700);
    const tv = setInterval(() => setElapsed(Date.now() - startTimeRef.current), 250);
    try {
      const res = await (async () => {
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
        });
        if (!response.ok) {
          let serverError = "Generation endpoint error.";
          try {
            const data = await response.json();
            serverError = data?.error || serverError;
          } catch {
            /* ignore */
          }
          throw new Error(serverError);
        }
        return (await response.json()) as AIGenerationResult;
      })();
      if (res.success && res.generatedHtml) {
        setHtml(res.generatedHtml);
        if (res.content) setContent(res.content);
        setGenerationContext({
          request,
          content: res.content ?? null,
          blueprint: res.blueprint ?? null,
          html: res.generatedHtml,
          provider: res.provider,
          model: res.model,
          steps: res.steps,
          processingTime: res.processingTime,
          usedFallback: res.usedFallback,
          createdAt: Date.now(),
        });
        const totalMs = res.processingTime ?? (Date.now() - startTimeRef.current);
        showToast({
          type: "success",
          title: "Infographic ready!",
          message: `Generated in ${formatElapsed(totalMs)} across ${res.steps?.length ?? 4} phases.${res.usedFallback ? " (single-shot mode)" : ""}`,
        });
        memoryRef.current = res.memory ?? memoryRef.current;
        // Save the memory for possible future regenerations (auto-deleted at next generation start).
        await saveAIMemory(projectIdRef.current ?? "temp", res.memory ?? []);
        persistProject();
      } else {
        memoryRef.current = res.memory ?? memoryRef.current;
        // Save the memory even on failure for possible retry.
        await saveAIMemory(projectIdRef.current ?? "temp", res.memory ?? []);
        const failedStep =
          res.steps?.find((s) => s.status === "failed")?.name ||
          (res.steps?.length ? "setup" : "provider call");
        console.error("Generation failed", { provider: res.provider, model: res.model, error: res.error, steps: res.steps });
        showToast({
          type: "error",
          title: "Generation failed",
          message: `${res.error || "Please try again."} [${res.provider}/${res.model} — ${failedStep}]`,
        });
      }
    } catch (e: any) {
      showToast({
        type: "error",
        title: "Generation failed",
        message: e?.message || "Please try again.",
      });
    } finally {
      clearInterval(iv);
      clearInterval(tv);
      generatingRef.current = false;
      setIsGenerating(false);
      setGenerating(false);
      setStep(0);
    }
    }, [requestInput, genInputType, aspectRatio, activeConfig, providers, hasContent, setContent, setGenerating, setGenerationContext, showToast, persistProject]);

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
          />
        </div>
        {/* Mobile drawer input */}
        {mobileInputOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileInputOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex shadow-2xl">
              <InputPanel
                input={input}
                setInput={setInput}
                onGenerateClick={() => {
                  setMobileInputOpen(false);
                  handleGenerate();
                }}
                isGenerating={isGenerating}
              />
              <button
                onClick={() => setMobileInputOpen(false)}
                aria-label="Close content panel"
                className="self-start m-2 p-2 rounded-lg bg-surface-800/80 text-surface-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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
            <div className="flex items-center gap-1.5 sm:gap-2">
              {isGenerating && (
                <div className="hidden md:flex items-center gap-2 text-sm text-surface-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{LOADING_STEPS[step]}</span>
                  <span className="tabular-nums text-surface-500">{formatElapsed(elapsed)}</span>
                </div>
              )}
              <button
                onClick={() => setMobileInputOpen(true)}
                aria-label="Edit content"
                className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-brand-gradient text-white"
              >
                <PenLine className="w-4 h-4" /> Content
              </button>
              <Link
                href="/dashboard"
                aria-label="Your projects"
                title="Your projects"
                className="p-2 hover:bg-white/5 rounded-lg text-surface-300 hover:text-white"
              >
                <LayoutDashboard className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setShowSettings(true)}
                aria-label="Open settings"
                className="p-2 hover:bg-white/5 rounded-lg text-surface-300 hover:text-white"
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
          />
        </div>
        <StylePanel
          onRegenerate={handleGenerate}
          isGenerating={isGenerating}
          hasContent={hasContent}
        />
        </div>
      </div>
      <ProviderSettings open={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
