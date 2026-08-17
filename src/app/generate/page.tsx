"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, Settings, Sparkles } from "lucide-react";
import InputPanel, { InputTab } from "@/components/generate/InputPanel";
import CanvasView from "@/components/generate/CanvasView";
import StylePanel from "@/components/generate/StylePanel";
import ProviderSettings from "@/components/generate/ProviderSettings";
import Toast from "@/components/ui/Toast";
import { generateContent } from "@/services/ai/provider";
import { useEditorStore } from "@/stores/editorStore";
import { useAIStore } from "@/stores/aiStore";
import { useUIStore } from "@/stores/uiStore";
import { Purpose } from "@/lib/purposes";
import { APP_NAME } from "@/lib/site";
import { ASPECT_RATIOS } from "@/lib/constants";
import { AspectRatio, AspectRatioId, FontId, ThemeId, AIGenerationRequest } from "@/lib/types";

const LOADING_STEPS = [
  "Analyzing your content…",
  "Structuring data…",
  "Designing layout…",
  "Rendering…",
];

export default function GeneratePage() {
  const { setContent, setGenerating } = useEditorStore();
  const { showToast } = useUIStore();
  const providers = useAIStore((s) => s.providers);
  const activeConfig = useAIStore((s) => s.getActiveConfig());

  const [input, setInput] = useState("");
  const [inputType, setInputType] = useState<InputTab>("text");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [purpose, setPurpose] = useState<Purpose>("other");
  const [userIntent, setUserIntent] = useState("");
  const [theme, setTheme] = useState<ThemeId>("modern");
  const [density, setDensity] = useState<"compact" | "balanced" | "spacious">("balanced");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(ASPECT_RATIOS["1:1"]);
  const [zoom, setZoom] = useState(100);
  const [html, setHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const genInputType: AIGenerationRequest["inputType"] =
    inputType === "image" ? "image" : "text";
  const requestInput =
    inputType === "image"
      ? input
      : inputType === "url"
        ? `Summarize this article into concise, data-oriented infographic content: ${imageUrl}`
        : input;
  const hasContent = Boolean(requestInput) && requestInput.trim().length > 0;
  const effectiveUserIntent =
    density === "balanced"
      ? userIntent
      : [userIntent, `Use a ${density} layout density.`].filter(Boolean).join(" ");

  const handleGenerate = useCallback(async () => {
    if (!hasContent) {
      showToast({ type: "error", title: "Input required", message: "Please provide some content before generating." });
      return;
    }
    const request: AIGenerationRequest = {
      input: requestInput,
      inputType: genInputType,
      aspectRatio: aspectRatio.id as AspectRatioId,
      aspectRatioWidth: aspectRatio.width,
      aspectRatioHeight: aspectRatio.height,
      purpose: purpose || undefined,
      theme,
      font: "inter" as FontId,
      language: "en",
      audience: "general",
      userIntent: effectiveUserIntent || undefined,
    };
    setIsGenerating(true);
    setHtml(null);
    setStep(0);
    setGenerating(true);
    const iv = setInterval(() => setStep((s) => (s + 1) % LOADING_STEPS.length), 700);
    try {
      const res = await generateContent(request, {
        apiKey: activeConfig?.apiKey ?? "",
        providerId: activeConfig?.id ?? "openai",
        model: activeConfig?.model ?? "",
        temperature: activeConfig?.temperature ?? 0.5,
        maxTokens: activeConfig?.maxTokens ?? 2048,
        storedProviders: providers.map((p) => ({
          id: p.id,
          apiKey: p.apiKey,
          model: p.model,
        })),
      });
      if (res.success && res.generatedHtml) {
        setHtml(res.generatedHtml);
        if (res.content) setContent(res.content);
        showToast({
          type: "success",
          title: res.usedFallback ? "Generated (offline mode)" : "Infographic ready!",
          message: res.usedFallback ? "No AI key configured — used the built-in generator." : undefined,
        });
      } else {
        throw new Error(res.error || "Generation failed.");
      }
    } catch (e: any) {
      showToast({ type: "error", title: "Generation failed", message: e?.message || "Please try again." });
    } finally {
      clearInterval(iv);
      setIsGenerating(false);
      setGenerating(false);
      setStep(0);
    }
  }, [requestInput, genInputType, aspectRatio, purpose, theme, effectiveUserIntent, activeConfig, providers, hasContent, setContent, setGenerating, showToast]);

  const handleExport = useCallback(
    async (format: "png" | "jpg" | "pdf" | "svg" | "json") => {
      if (!html) return;
      try {
        const el = document.querySelector(".template-canvas-container") as HTMLElement;
        if (!el) {
          showToast({ type: "error", title: "Export failed", message: "No canvas found." });
          return;
        }
        if (format === "json") {
          const blob = new Blob([JSON.stringify({ html }, null, 2)], { type: "application/json" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "infographic.json";
          a.click();
          return;
        }
        const mod = await import("html-to-image");
        const fn = format === "jpg" ? mod.toJpeg : format === "svg" ? mod.toSvg : mod.toPng;
        const dataUrl = await fn(el, { quality: 1, pixelRatio: 2 });
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
      } catch {
        showToast({ type: "error", title: "Export failed", message: "Please try again." });
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
        <InputPanel
          input={input}
          setInput={setInput}
          inputType={inputType}
          setInputType={setInputType}
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          imageFile={imageFile}
          setImageFile={setImageFile}
          purpose={purpose}
          setPurpose={setPurpose}
          userIntent={userIntent}
          setUserIntent={setUserIntent}
          onGenerateClick={handleGenerate}
          isGenerating={isGenerating}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 border-b border-white/5 px-4 flex items-center justify-between bg-surface-900/60 backdrop-blur-xl">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-lg shadow-brand-900/40 transition-transform group-hover:scale-105">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-baseline gap-2">
                <h1 className="font-display font-semibold text-white leading-tight">{APP_NAME}</h1>
                <span className="hidden sm:inline text-[11px] text-surface-400 uppercase tracking-wider">Creator</span>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              {isGenerating && (
                <div className="flex items-center gap-2 text-sm text-surface-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{LOADING_STEPS[step]}</span>
                </div>
              )}
              <button
                onClick={() => setShowSettings(true)}
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
          />
        </div>
        <StylePanel
          theme={theme}
          setTheme={setTheme}
          density={density}
          setDensity={setDensity}
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