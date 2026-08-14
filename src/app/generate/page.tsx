"use client";

import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import InputPanel, { InputTab, Purpose } from "@/components/generate/InputPanel";
import CanvasView from "@/components/generate/CanvasView";
import StylePanel from "@/components/generate/StylePanel";
import { generateContent } from "@/services/ai/provider";
import { getAspectRatio } from "@/services/template/templateEngine";
import { useEditorStore } from "@/stores/editorStore";
import { useAIStore } from "@/stores/aiStore";
import { useUIStore } from "@/stores/uiStore";
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
  const activeConfig = useAIStore((s) => s.getActiveConfig());

  const [input, setInput] = useState("");
  const [inputType, setInputType] = useState<InputTab>("text");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [purpose, setPurpose] = useState<Purpose>("other");
  const [userIntent, setUserIntent] = useState("");
  const [layout, setLayout] = useState("modern");
  const [density, setDensity] = useState<"compact" | "balanced" | "spacious">("balanced");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(getAspectRatio("1:1"));
  const [zoom, setZoom] = useState(100);
  const [html, setHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState(0);

  const genInputType: AIGenerationRequest["inputType"] =
    inputType === "image" ? "image" : "text";
  const requestInput =
    inputType === "image"
      ? input
      : inputType === "url"
        ? `Summarize this article into concise, data-oriented infographic content: ${imageUrl}`
        : input;
  const hasContent = Boolean(requestInput) && requestInput.trim().length > 0;
  const resolvedTheme = (
    ["modern", "light", "dark", "minimal", "corporate", "gradient"].includes(layout)
      ? layout
      : "modern"
  ) as ThemeId;

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
      theme: resolvedTheme,
      font: "inter" as FontId,
      language: "en",
      audience: "general",
      userIntent: userIntent || undefined,
    };
    setIsGenerating(true);
    setHtml(null);
    setStep(0);
    setGenerating(true);
    const iv = setInterval(() => setStep((s) => (s + 1) % LOADING_STEPS.length), 700);
    try {
      const res = await generateContent(
        request,
        activeConfig?.apiKey ?? "",
        activeConfig?.id ?? "openai",
        activeConfig?.model ?? "",
        activeConfig?.temperature ?? 0.5,
        activeConfig?.maxTokens ?? 2048,
      );
      if (res.success && res.generatedHtml) {
        setHtml(res.generatedHtml);
        if (res.content) setContent(res.content);
        showToast({ type: "success", title: "Infographic ready!" });
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
  }, [requestInput, genInputType, aspectRatio, purpose, resolvedTheme, userIntent, activeConfig, hasContent, setContent, setGenerating, showToast]);

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
          const pdf = new jsPDF({ orientation: aspectRatio.width > aspectRatio.height ? "landscape" : "portrait", unit: "px", format: [aspectRatio.width, aspectRatio.height] });
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
    <div className="flex h-screen overflow-hidden bg-navy-950 text-surface-100 font-body">
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
        <header className="h-14 border-b border-white/5 px-4 flex items-center justify-between">
          <h1 className="font-display font-semibold text-white">Creator</h1>
          {isGenerating && (
            <div className="flex items-center gap-2 text-sm text-surface-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{LOADING_STEPS[step]}</span>
            </div>
          )}
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
        layout={layout}
        setLayout={setLayout}
        density={density}
        setDensity={setDensity}
        onRegenerate={handleGenerate}
        isGenerating={isGenerating}
        hasContent={hasContent}
      />
    </div>
  );

}
