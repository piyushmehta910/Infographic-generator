"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Download,
  Settings,
  ArrowLeft,
  FileText,
  Upload,
  X,
  AlertCircle,
  Loader2,
  FileJson,
  FileImage,
  Brain,
  Zap,
  Image as ImageIcon,
  Globe,
  RotateCcw,
  Wand2,
  Layout,
  Menu,
  RefreshCw,
} from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";
import { useAIStore } from "@/stores/aiStore";
import { useUIStore } from "@/stores/uiStore";
import Toast from "@/components/ui/Toast";
import { AIDesignRenderer } from "@/components/templates/AIDesignRenderer";
import { generateContent, setStoredProvidersGetter } from "@/services/ai/provider";
import { getAspectRatio } from "@/services/template/templateEngine";
import { ASPECT_RATIOS, AI_PROVIDERS } from "@/lib/constants";
import {
  InfographicContent,
  AIGenerationRequest,
  FontId,
} from "@/lib/types";

const PURPOSES = [
  { id: "social-media", label: "Social Media", icon: "📱", desc: "Instagram, LinkedIn, Facebook" },
  { id: "presentation", label: "Presentation", icon: "📊", desc: "Slides, decks, meetings" },
  { id: "report", label: "Report", icon: "📄", desc: "Business & research reports" },
  { id: "education", label: "Education", icon: "📚", desc: "Learning materials" },
  { id: "marketing", label: "Marketing", icon: "📢", desc: "Ads & campaigns" },
  { id: "other", label: "Other", icon: "✨", desc: "Custom purpose" },
];

const EXAMPLE_INTENTS = [
  "Make it look modern with dark theme and neon accents",
  "Use bold colors with large statistics",
  "Clean minimal design with lots of whitespace",
  "Corporate professional style with navy and gold",
  "Playful and colorful for social media",
  "Tech-focused with gradient backgrounds",
];

export default function DashboardPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);

  const { content, setContent, setMode, reset } = useEditorStore();
  const {
    providers,
    activeProvider,
    setProvider,
    setActiveProvider,
    getActiveConfig,
  } = useAIStore();
  const { showToast } = useUIStore();

  const [input, setInput] = useState("");
  const [inputType, setInputType] = useState<"text" | "image" | "image-url">("text");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [aspectRatio, setAspectRatioState] = useState(getAspectRatio("1:1"));
  const [customWidth, setCustomWidth] = useState(1080);
  const [customHeight, setCustomHeight] = useState(1080);
  const [showAspectRatioModal, setShowAspectRatioModal] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [purpose, setPurpose] = useState("");
  const [showPurposeDialog, setShowPurposeDialog] = useState(false);
  const [userIntent, setUserIntent] = useState("");
  const [showIntentExamples, setShowIntentExamples] = useState(false);

  const generationSteps = [
    { id: 0, label: "Analyzing Content", icon: "📝" },
    { id: 1, label: "Structuring Data", icon: "🧠" },
    { id: 2, label: "Designing Layout", icon: "🎨" },
    { id: 3, label: "Generating HTML", icon: "⚡" },
    { id: 4, label: "Rendering", icon: "✨" },
  ];

  useEffect(() => {
    setStoredProvidersGetter(() => providers);
  }, [providers]);

  const handleImageUpload = useCallback((file: File) => {
    setImageFile(file);
    setInputType("image");
    const reader = new FileReader();
    reader.onload = (e) => setInput((e.target?.result as string) || "");
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (inputType === "text" && !input.trim()) {
      showToast({ type: "error", title: "Input Required", message: "Please enter some content." });
      return;
    }
    if (inputType === "image" && !imageFile) {
      showToast({ type: "error", title: "Input Required", message: "Please upload an image." });
      return;
    }
    if (inputType === "image-url" && !imageUrl.trim()) {
      showToast({ type: "error", title: "Input Required", message: "Please enter an image URL." });
      return;
    }

    if (!purpose) {
      setShowPurposeDialog(true);
      return;
    }

    const activeConfig = getActiveConfig();
    if (!activeConfig?.apiKey) {
      showToast({ type: "error", title: "API Key Required", message: "Configure your AI provider in Settings." });
      setShowSettings(true);
      return;
    }

    setIsLoading(true);
    setGeneratedHtml("");
    setGenerationStep(0);
    setGenerationProgress(0);

    try {
      setGenerationStep(0);
      setGenerationProgress(10);
      setLoadingMessage("Analyzing your content...");

      const request: AIGenerationRequest = {
        input: inputType === "image-url" ? imageUrl : input,
        inputType: inputType as any,
        aspectRatio: aspectRatio.id,
        aspectRatioWidth: aspectRatio.width,
        aspectRatioHeight: aspectRatio.height,
        purpose,
        theme: "modern",
        font: "inter" as FontId,
        userIntent: userIntent || undefined,
      };

      setGenerationStep(1);
      setGenerationProgress(30);
      setLoadingMessage("Structuring & improving content...");

      const result = await generateContent(
        request,
        activeConfig.apiKey,
        activeConfig.id,
        activeConfig.model,
        activeConfig.temperature,
        activeConfig.maxTokens,
      );

      setGenerationStep(2);
      setGenerationProgress(50);
      setLoadingMessage("Designing your infographic...");

      if (result.success && result.content) {
        setContent(result.content);
        setGenerationStep(3);
        setGenerationProgress(75);
        setLoadingMessage("Generating HTML code...");

        setGenerationStep(4);
        setGenerationProgress(90);
        setLoadingMessage("Rendering final image...");

        if (result.generatedHtml) {
          setGeneratedHtml(result.generatedHtml);
          showToast({ type: "success", title: "Infographic Ready!", message: "Your AI-generated infographic is ready." });
        } else {
          showToast({ type: "success", title: "Content Generated!", message: "Content structured successfully." });
        }
      } else {
        throw new Error(result.error || "Generation failed. Check your API key.");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Generation failed";
      showToast({ type: "error", title: "Generation Failed", message: msg });
    } finally {
      setGenerationProgress(100);
      setIsLoading(false);
      setLoadingMessage("");
      setGenerationStep(0);
      setGenerationProgress(0);
    }
  }, [input, inputType, imageFile, imageUrl, getActiveConfig, showToast, aspectRatio, purpose, userIntent, setContent]);

  const handleExport = useCallback(
    async (format: "png" | "jpg" | "pdf" | "json") => {
      try {
        if (format === "json") {
          const blob = new Blob([JSON.stringify({ content, html: generatedHtml }, null, 2)], { type: "application/json" });
          const link = document.createElement("a");
          link.download = `${content?.title || "infographic"}.json`;
          link.href = URL.createObjectURL(blob);
          link.click();
        } else {
          const { toPng, toJpeg } = await import("html-to-image");
          const element = document.querySelector(".template-canvas-container") as HTMLElement;
          if (!element) {
            showToast({ type: "error", title: "Export Failed", message: "No infographic found." });
            return;
          }

          if (format === "png") {
            const dataUrl = await toPng(element, { quality: 1, pixelRatio: 2 });
            const link = document.createElement("a");
            link.download = `${content?.title || "infographic"}.png`;
            link.href = dataUrl;
            link.click();
          } else if (format === "jpg") {
            const dataUrl = await toJpeg(element, { quality: 0.9, pixelRatio: 2 });
            const link = document.createElement("a");
            link.download = `${content?.title || "infographic"}.jpg`;
            link.href = dataUrl;
            link.click();
          } else if (format === "pdf") {
            const { jsPDF } = await import("jspdf");
            const dataUrl = await toPng(element, { quality: 1, pixelRatio: 2 });
            const pdf = new jsPDF({
              orientation: aspectRatio.width > aspectRatio.height ? "landscape" : "portrait",
              unit: "px",
              format: [aspectRatio.width, aspectRatio.height],
            });
            pdf.addImage(dataUrl, "PNG", 0, 0, aspectRatio.width, aspectRatio.height);
            pdf.save(`${content?.title || "infographic"}.pdf`);
          }
        }
        showToast({ type: "success", title: `Exported as ${format.toUpperCase()}` });
        setShowExport(false);
      } catch (error) {
        showToast({ type: "error", title: "Export Failed", message: "Please try again" });
      }
    },
    [content, generatedHtml, aspectRatio, showToast],
  );

  const handleReset = useCallback(() => {
    setInput("");
    setInputType("text");
    setImageFile(null);
    setImageUrl("");
    setGeneratedHtml("");
    setPurpose("");
    setUserIntent("");
    reset();
    showToast({ type: "info", title: "Reset", message: "Ready for new infographic." });
  }, [reset, showToast]);

  return (
    <>
      <Toast />
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-4 gap-3 flex-shrink-0 z-20">
          <button onClick={() => setMobilePanelOpen(true)} className="md:hidden p-2 hover:bg-slate-100 rounded-lg">
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <button onClick={() => router.push("/")} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:inline">
              InfoGraphic AI
            </span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            {generatedHtml && (
              <button onClick={() => setShowExport(true)} className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
            <button onClick={handleReset} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600" title="New">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={() => setShowSettings(true)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600" title="Settings">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          {mobilePanelOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setMobilePanelOpen(false)} />}

          {/* Sidebar */}
          <div className={`w-full md:w-[440px] bg-white border-r border-slate-200 overflow-y-auto flex-shrink-0 ${mobilePanelOpen ? "flex" : "hidden md:flex"} fixed md:relative inset-y-0 left-0 z-40 md:z-auto transition-transform duration-300 ${mobilePanelOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
            <div className="p-5 space-y-5 w-full">
              <div className="md:hidden flex justify-end mb-2">
                <button onClick={() => setMobilePanelOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Create Infographic</h1>
                <p className="text-sm text-slate-500">AI generates unique designs based on your content</p>
              </div>

              {/* Input Type Tabs */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                {[
                  { id: "text", icon: FileText, label: "Text" },
                  { id: "image", icon: ImageIcon, label: "Image" },
                  { id: "image-url", icon: Globe, label: "URL" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => { setInputType(mode.id as any); setInput(""); setImageFile(null); setImageUrl(""); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${inputType === mode.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    <mode.icon className="w-4 h-4" />
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Text Input */}
              {inputType === "text" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Your Content</label>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste notes, articles, reports, or describe an idea..."
                    rows={6}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              )}

              {/* Image Upload */}
              {inputType === "image" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Upload Image</label>
                  <div
                    className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onClick={() => document.getElementById("image-upload")?.click()}
                  >
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Drop an image or click to browse</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP up to 10MB</p>
                    <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                  </div>
                </div>
              )}

              {/* Image URL */}
              {inputType === "image-url" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Image URL</label>
                  <input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-400">AI will analyze the image content</p>
                </div>
              )}

              {/* Design Intent */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">
                    Design Intent <span className="text-slate-400 text-xs">(optional)</span>
                  </label>
                  <button onClick={() => setShowIntentExamples(!showIntentExamples)} className="text-xs text-blue-600 hover:text-blue-700">
                    Examples
                  </button>
                </div>
                <textarea
                  value={userIntent}
                  onChange={(e) => setUserIntent(e.target.value)}
                  placeholder="Describe how you want it to look... e.g., 'Dark theme with neon accents' or leave empty for AI to decide"
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                {showIntentExamples && (
                  <div className="space-y-1.5">
                    {EXAMPLE_INTENTS.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => { setUserIntent(ex); setShowIntentExamples(false); }}
                        className="block w-full text-left px-3 py-2 text-xs text-slate-600 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Purpose */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Purpose {purpose && <span className="text-blue-600">({PURPOSES.find(p => p.id === purpose)?.label})</span>}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PURPOSES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPurpose(p.id)}
                      className={`p-2.5 rounded-xl text-xs border-2 transition-all text-center ${purpose === p.id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
                    >
                      <div className="text-lg mb-0.5">{p.icon}</div>
                      <div className="font-medium text-slate-900">{p.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Aspect Ratio</label>
                  <button onClick={() => setShowAspectRatioModal(true)} className="text-xs text-blue-600 hover:text-blue-700">
                    Change
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>{aspectRatio.label}</span>
                  <span className="text-slate-400">{aspectRatio.width} × {aspectRatio.height}px</span>
                </div>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="space-y-4 py-4">
                  <div className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    >
                      <Zap className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-slate-800">AI is Creating</h3>
                    <p className="text-slate-500 text-sm">{loadingMessage}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Progress</span>
                      <span>{generationProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-full rounded-full"
                        animate={{ width: `${generationProgress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {generationSteps.map((step) => (
                      <div
                        key={step.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${generationStep === step.id ? "bg-blue-50 border border-blue-200" : generationStep > step.id ? "bg-green-50 opacity-60" : "bg-slate-50 opacity-40"}`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${generationStep === step.id ? "bg-blue-600 text-white" : generationStep > step.id ? "bg-green-500 text-white" : "bg-slate-300 text-slate-500"}`}>
                          {generationStep > step.id ? "✓" : step.icon}
                        </div>
                        <span className={`text-sm font-medium ${generationStep === step.id ? "text-blue-700" : "text-slate-600"}`}>{step.label}</span>
                        {generationStep === step.id && <Loader2 className="w-4 h-4 animate-spin text-blue-600 ml-auto" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /><span>{loadingMessage}</span></>
                ) : (
                  <><Wand2 className="w-5 h-5" /> Generate Infographic</>
                )}
              </button>

              {generatedHtml && !isLoading && (
                <button
                  onClick={() => setShowExport(true)}
                  className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
              )}

              <button onClick={() => setMobilePanelOpen(false)} className="md:hidden w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium">
                View Canvas
              </button>
            </div>
          </div>

          {/* Canvas */}
          <main className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center relative">
            {!mobilePanelOpen && !generatedHtml && (
              <button
                onClick={() => setMobilePanelOpen(true)}
                className="md:hidden fixed bottom-6 right-6 z-20 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center"
              >
                <Wand2 className="w-6 h-6" />
              </button>
            )}
            <div className="flex items-center justify-center min-h-full w-full p-4">
              {generatedHtml ? (
                <div ref={canvasRef} className="shadow-2xl rounded-lg overflow-hidden w-full" style={{ maxWidth: "100%" }}>
                  <AIDesignRenderer html={generatedHtml} aspectRatio={aspectRatio} />
                </div>
              ) : (
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Wand2 className="w-12 h-12 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-3">Ready to Create</h2>
                  <p className="text-slate-500 mb-6">Paste content, choose purpose & aspect ratio, then generate.</p>
                  <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
                    <div className="flex items-center gap-1.5"><Brain className="w-4 h-4" /> AI Powered</div>
                    <div className="flex items-center gap-1.5"><Download className="w-4 h-4" /> Multiple Formats</div>
                    <div className="flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Instant</div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Purpose Dialog */}
      <AnimatePresence>
        {showPurposeDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowPurposeDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">🎯 What is the purpose?</h2>
                <button onClick={() => setShowPurposeDialog(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-6">This helps AI design the perfect layout for your needs.</p>
              <div className="grid grid-cols-2 gap-3">
                {PURPOSES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setPurpose(p.id); setShowPurposeDialog(false); }}
                    className="p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="text-2xl mb-2">{p.icon}</div>
                    <div className="font-semibold text-slate-900">{p.label}</div>
                    <div className="text-xs text-slate-500 mt-1">{p.desc}</div>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowPurposeDialog(false)} className="w-full mt-4 py-2.5 text-sm text-slate-500 hover:text-slate-700">
                Skip (AI will choose)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" /> Settings
                </h2>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="space-y-5">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">API Keys stored locally in your browser only.</p>
                      <p className="text-xs text-blue-600 mt-0.5">Never sent to our servers.</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">AI Provider</label>
                  <div className="grid grid-cols-3 gap-2">
                    {providers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setActiveProvider(p.id)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-medium border-2 transition-all ${activeProvider === p.id ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
                {providers.filter((p) => p.id === activeProvider).map((provider) => (
                  <React.Fragment key={provider.id}>
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1.5">API Key</label>
                      <input
                        type="password"
                        value={provider.apiKey}
                        onChange={(e) => setProvider({ ...provider, apiKey: e.target.value })}
                        placeholder={`Enter your ${provider.name} API key...`}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <a href={AI_PROVIDERS.find((p) => p.id === provider.id)?.docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-700 mt-1.5 inline-block">
                        Get your API key →
                      </a>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1.5">Model</label>
                      <select
                        value={provider.model}
                        onChange={(e) => setProvider({ ...provider, model: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {(AI_PROVIDERS.find((p) => p.id === provider.id)?.models || []).map((model) => (
                          <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1.5">Temperature: {provider.temperature}</label>
                        <input type="range" min="0" max="2" step="0.1" value={provider.temperature} onChange={(e) => setProvider({ ...provider, temperature: parseFloat(e.target.value) })} className="w-full accent-blue-600" />
                        <div className="flex justify-between text-xs text-slate-400"><span>Precise</span><span>Creative</span></div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1.5">Max Tokens: {provider.maxTokens}</label>
                        <input type="range" min="256" max="4096" step="256" value={provider.maxTokens} onChange={(e) => setProvider({ ...provider, maxTokens: parseInt(e.target.value) })} className="w-full accent-blue-600" />
                        <div className="flex justify-between text-xs text-slate-400"><span>256</span><span>4096</span></div>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aspect Ratio Modal */}
      <AnimatePresence>
        {showAspectRatioModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowAspectRatioModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Layout className="w-5 h-5 text-blue-600" /> Aspect Ratio
                </h2>
                <button onClick={() => setShowAspectRatioModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(ASPECT_RATIOS).map(([key, ratio]) => (
                  <button
                    key={key}
                    onClick={() => { setAspectRatioState(ratio); if (ratio.id !== "custom") setShowAspectRatioModal(false); }}
                    className={`p-4 border-2 rounded-xl hover:border-blue-500 transition-colors text-center ${aspectRatio.id === ratio.id ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}
                  >
                    <div className="font-medium text-slate-900">{ratio.label}</div>
                    <div className="text-xs text-slate-500">{ratio.id === "custom" ? "Custom" : `${ratio.width} × ${ratio.height}px`}</div>
                  </button>
                ))}
              </div>
              {aspectRatio.id === "custom" && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-slate-700 block mb-1">Width (px)</label>
                      <input type="number" value={customWidth} onChange={(e) => setCustomWidth(Math.max(100, Math.min(5000, parseInt(e.target.value) || 1080)))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" min="100" max="5000" />
                    </div>
                    <div>
                      <label className="text-sm text-slate-700 block mb-1">Height (px)</label>
                      <input type="number" value={customHeight} onChange={(e) => setCustomHeight(Math.max(100, Math.min(5000, parseInt(e.target.value) || 1080)))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" min="100" max="5000" />
                    </div>
                  </div>
                  <button
                    onClick={() => { setAspectRatioState({ ...aspectRatio, width: customWidth, height: customHeight }); setShowAspectRatioModal(false); }}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    Apply Custom Size
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Modal */}
      <AnimatePresence>
        {showExport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            onClick={() => setShowExport(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Download className="w-5 h-5" /> Export
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleExport("png")} className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 transition-colors text-center">
                  <FileImage className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="font-medium text-slate-900">PNG</div>
                  <div className="text-xs text-slate-500">High quality</div>
                </button>
                <button onClick={() => handleExport("jpg")} className="p-6 border-2 border-slate-200 rounded-xl hover:border-green-500 transition-colors text-center">
                  <FileImage className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="font-medium text-slate-900">JPG</div>
                  <div className="text-xs text-slate-500">Compressed</div>
                </button>
                <button onClick={() => handleExport("pdf")} className="p-6 border-2 border-slate-200 rounded-xl hover:border-red-500 transition-colors text-center">
                  <FileText className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <div className="font-medium text-slate-900">PDF</div>
                  <div className="text-xs text-slate-500">Print-ready</div>
                </button>
                <button onClick={() => handleExport("json")} className="p-6 border-2 border-slate-200 rounded-xl hover:border-orange-500 transition-colors text-center">
                  <FileJson className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="font-medium text-slate-900">JSON</div>
                  <div className="text-xs text-slate-500">Project data</div>
                </button>
              </div>
              <button onClick={() => setShowExport(false)} className="w-full mt-6 py-3 bg-slate-100 rounded-xl text-slate-700 font-medium hover:bg-slate-200">
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}