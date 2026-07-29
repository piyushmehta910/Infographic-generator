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
  Smartphone,
} from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";
import { useAIStore } from "@/stores/aiStore";
import { useUIStore } from "@/stores/uiStore";
import Toast from "@/components/ui/Toast";
import { AIDesignRenderer } from "@/components/templates/AIDesignRenderer";
import { generateContent, setStoredProvidersGetter } from "@/services/ai/provider";
import { getTheme, getAspectRatio } from "@/services/template/templateEngine";
import { ASPECT_RATIOS, AI_PROVIDERS } from "@/lib/constants";
import {
  InfographicContent,
  AIGenerationRequest,
  FontId,
} from "@/lib/types";

const PURPOSES = [
  { id: "social-media", label: "Social Media", icon: "📱", desc: "Instagram, LinkedIn, Facebook posts" },
  { id: "presentation", label: "Presentation", icon: "📊", desc: "Slides, decks, meetings" },
  { id: "report", label: "Report", icon: "📄", desc: "Business reports, research papers" },
  { id: "education", label: "Education", icon: "📚", desc: "Learning materials, tutorials" },
  { id: "marketing", label: "Marketing", icon: "📢", desc: "Ads, campaigns, promotions" },
  { id: "other", label: "Other", icon: "✨", desc: "Custom purpose" },
];

export default function DashboardPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);

  const { content, settings, editor, setContent, setSettings, setMode, reset } =
    useEditorStore();

  const {
    providers,
    activeProvider,
    setProvider,
    setActiveProvider,
    getActiveConfig,
  } = useAIStore();
  const { showToast } = useUIStore();

  const [input, setInput] = useState("");
  const [inputType, setInputType] = useState<
    "text" | "image" | "image-url"
  >("text");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [currentHtml, setCurrentHtml] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editableTitle, setEditableTitle] = useState("");
  const [editableSubtitle, setEditableSubtitle] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [showMobileProperties, setShowMobileProperties] = useState(false);
  const [aspectRatio, setAspectRatioState] = useState(getAspectRatio("1:1"));
  const [customWidth, setCustomWidth] = useState(800);
  const [customHeight, setCustomHeight] = useState(800);
  const [showAspectRatioModal, setShowAspectRatioModal] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [showPurposeDialog, setShowPurposeDialog] = useState(false);

  const theme = getTheme("modern");

  const generationSteps = [
    { id: 0, label: "Analyzing Content", icon: "📝" },
    { id: 1, label: "Structuring Data", icon: "🧠" },
    { id: 2, label: "Designing Layout", icon: "🎨" },
    { id: 3, label: "Generating HTML", icon: "⚡" },
    { id: 4, label: "Rendering Image", icon: "✨" },
  ];

  // Wire up the stored providers getter for automatic fallback
  useEffect(() => {
    setStoredProvidersGetter(() => providers);
  }, [providers]);

  useEffect(() => {
    const sampleContent: InfographicContent = {
      title: "Welcome to InfoGraphic AI",
      subtitle: "Create stunning infographics with AI",
      sections: [
        {
          id: "1",
          title: "AI-Powered Generation",
          content:
            "Transform text, ideas, or images into professional infographics.",
          icon: "✨",
        },
        {
          id: "2",
          title: "Custom Design",
          content: "AI creates unique designs tailored to your content.",
          icon: "🎨",
        },
        {
          id: "3",
          title: "Multiple Exports",
          content: "Download as PNG, SVG, PDF, or HTML.",
          icon: "📥",
        },
      ],
      statistics: [
        { id: "1", value: "4", label: "AI Steps", icon: "🤖" },
        { id: "2", value: "∞", label: "Designs", icon: "🎨" },
        { id: "3", value: "5", label: "Formats", icon: "💾" },
        { id: "4", value: "8", label: "Ratios", icon: "📐" },
      ],
      timeline: [],
      colors: ["#3B82F6", "#8B5CF6", "#EC4899"],
      icons: ["✨", "🎨", "📥", "📊", "🤖", "💾", "📐"],
      callToAction: "Start Creating Now →",
    };
    setContent(sampleContent);
    setMode("editing");
  }, []);

  const handleImageUpload = useCallback((file: File) => {
    setImageFile(file);
    setInputType("image");
    const reader = new FileReader();
    reader.onload = (e) => {
      setInput((e.target?.result as string) || "");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (inputType === "text" && !input.trim()) {
      showToast({
        type: "error",
        title: "Input Required",
        message: "Please enter some content.",
      });
      return;
    }
    if (inputType === "image" && !imageFile) {
      showToast({
        type: "error",
        title: "Input Required",
        message: "Please upload an image.",
      });
      return;
    }
    if (inputType === "image-url" && !imageUrl.trim()) {
      showToast({
        type: "error",
        title: "Input Required",
        message: "Please enter an image URL.",
      });
      return;
    }

    // Show purpose dialog if not selected
    if (!purpose) {
      setShowPurposeDialog(true);
      return;
    }

    const activeConfig = getActiveConfig();
    if (!activeConfig?.apiKey) {
      showToast({
        type: "error",
        title: "API Key Required",
        message: "Configure your AI provider in Settings.",
      });
      setShowSettings(true);
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Analyzing content...");
    setGeneratedHtml("");
    setCurrentHtml("");
    setGenerationStep(0);
    setGenerationProgress(0);

    try {
      // Step 1: Analyzing Content
      setGenerationStep(0);
      setGenerationProgress(10);
      setLoadingMessage("Analyzing your content...");

      const request: AIGenerationRequest = {
        input: inputType === "image" ? input : input,
        inputType: inputType as any,
        aspectRatio: aspectRatio.id,
        aspectRatioWidth: aspectRatio.width,
        aspectRatioHeight: aspectRatio.height,
        purpose: purpose,
        theme: "modern",
        font: "inter" as FontId,
      };

      // Step 2: Structuring Data
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

      // Step 3: Designing Layout
      setGenerationStep(2);
      setGenerationProgress(50);
      setLoadingMessage("Designing your infographic...");

      if (result.success && result.content) {
        setContent(result.content);

        // Step 4: Generating HTML
        setGenerationStep(3);
        setGenerationProgress(75);
        setLoadingMessage("Generating HTML code...");

        // Step 5: Rendering
        setGenerationStep(4);
        setGenerationProgress(90);
        setLoadingMessage("Rendering final image...");

        if (result.generatedHtml) {
          setGeneratedHtml(result.generatedHtml);
          setCurrentHtml(result.generatedHtml);
          showToast({
            type: "success",
            title: "Infographic Ready!",
            message:
              "Your AI-generated infographic is ready to view and export.",
          });
        } else {
          const blankHtml = generateBlankHtml(result.content, theme);
          setGeneratedHtml(blankHtml);
          setCurrentHtml(blankHtml);
          showToast({
            type: "success",
            title: "Infographic Created!",
            message: "Your infographic has been generated.",
          });
        }
      } else {
        throw new Error(
          result.error ||
            "Generation failed. Check your API key and try again.",
        );
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Generation failed";
      if (msg.includes("GROQ_RATE_LIMIT")) {
        showToast({
          type: "error",
          title: "Groq Rate Limit Exceeded",
          message:
            "The request was too large for your current Groq service tier. Please try: 1) Using a smaller model, 2) Reducing your input size, or 3) Upgrading your Groq plan.",
        });
      } else {
        showToast({ type: "error", title: "Generation Failed", message: msg });
      }
    } finally {
      setGenerationProgress(100);
      setIsLoading(false);
      setLoadingMessage("");
      setGenerationStep(0);
      setGenerationProgress(0);
    }
  }, [
    input,
    inputType,
    imageFile,
    imageUrl,
    getActiveConfig,
    theme,
    showToast,
    aspectRatio,
    purpose,
  ]);

  const handleExport = useCallback(
    async (format: "png" | "jpg" | "svg" | "pdf" | "json") => {
      const canvas =
        document.getElementById("infographic-canvas") ||
        document.querySelector(".template-canvas-container iframe") ||
        document.querySelector('[id="infographic-canvas"]');
      if (!canvas) return;

      try {
        if (format === "png") {
          const { toPng } = await import("html-to-image");
          const element =
            document.getElementById("infographic-canvas") ||
            document.querySelector('[data-infographic="true"]');
          if (!element) {
            const iframe = document.querySelector("iframe");
            if (iframe) {
              const dataUrl = await toPng(iframe, {
                quality: 1,
                pixelRatio: 2,
              });
              const link = document.createElement("a");
              link.download = `${content?.title || "infographic"}.png`;
              link.href = dataUrl;
              link.click();
              showToast({ type: "success", title: "Exported as PNG" });
              setShowExport(false);
              return;
            }
          }
          if (element) {
            const dataUrl = await toPng(element as HTMLElement, {
              quality: 1,
              pixelRatio: 2,
            });
            const link = document.createElement("a");
            link.download = `${content?.title || "infographic"}.png`;
            link.href = dataUrl;
            link.click();
          }
        } else if (format === "jpg") {
          const { toJpeg } = await import("html-to-image");
          const element =
            document.getElementById("infographic-canvas") ||
            document.querySelector('[data-infographic="true"]');
          if (!element) {
            const iframe = document.querySelector("iframe");
            if (iframe) {
              const dataUrl = await toJpeg(iframe, {
                quality: 0.9,
                pixelRatio: 2,
              });
              const link = document.createElement("a");
              link.download = `${content?.title || "infographic"}.jpg`;
              link.href = dataUrl;
              link.click();
              showToast({ type: "success", title: "Exported as JPG" });
              setShowExport(false);
              return;
            }
          }
          if (element) {
            const dataUrl = await toJpeg(element as HTMLElement, {
              quality: 0.9,
              pixelRatio: 2,
            });
            const link = document.createElement("a");
            link.download = `${content?.title || "infographic"}.jpg`;
            link.href = dataUrl;
            link.click();
          }
        } else if (format === "pdf") {
          const { toPng } = await import("html-to-image");
          const { jsPDF } = await import("jspdf");
          const element =
            document.getElementById("infographic-canvas") ||
            document.querySelector('[data-infographic="true"]') ||
            document.querySelector("iframe");

          if (element) {
            const dataUrl = await toPng(element as HTMLElement, {
              quality: 1,
              pixelRatio: 2,
            });
            const img = new Image();
            img.src = dataUrl;
            await new Promise((resolve) => {
              img.onload = resolve;
            });

            const pdf = new jsPDF({
              orientation: aspectRatio.width > aspectRatio.height ? "landscape" : "portrait",
              unit: "px",
              format: [aspectRatio.width, aspectRatio.height],
            });
            pdf.addImage(dataUrl, "PNG", 0, 0, aspectRatio.width, aspectRatio.height);
            pdf.save(`${content?.title || "infographic"}.pdf`);
          }
        } else if (format === "json") {
          const blob = new Blob(
            [JSON.stringify({ content, html: generatedHtml }, null, 2)],
            { type: "application/json" },
          );
          const link = document.createElement("a");
          link.download = `${content?.title || "infographic"}.json`;
          link.href = URL.createObjectURL(blob);
          link.click();
        }
        showToast({
          type: "success",
          title: `Exported as ${format.toUpperCase()}`,
        });
        setShowExport(false);
      } catch (error) {
        showToast({
          type: "error",
          title: "Export Failed",
          message: "Please try again",
        });
      }
    },
    [content, generatedHtml, theme, showToast],
  );

  const handleReset = useCallback(() => {
    setInput("");
    setInputType("text");
    setImageFile(null);
    setImageUrl("");
    setGeneratedHtml("");
    setCurrentHtml("");
    setIsLoading(false);
    setPurpose("");
    reset();
    showToast({
      type: "info",
      title: "Reset",
      message: "Ready for new infographic.",
    });
  }, [reset, showToast]);

  return (
    <>
      <Toast />
      <div className="h-screen flex flex-col bg-gray-50">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-2 sm:px-4 gap-2 sm:gap-3 flex-shrink-0 z-20">
          <button
            onClick={() => setMobilePanelOpen(true)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Menu"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <button
            onClick={() => router.push("/")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Home"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:inline">
              InfoGraphic AI
            </span>
          </div>

          <div className="w-px h-6 bg-gray-200 hidden sm:block" />
          <div className="flex-1" />

          <div className="flex items-center gap-1 sm:gap-2">
            {generatedHtml && (
              <button
                onClick={() => setShowExport(true)}
                className="px-2 sm:px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
              >
                <Download className="w-3.5 h-3.5 inline sm:mr-1" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
            <button
              onClick={handleReset}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              title="New Infographic"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          {mobilePanelOpen && (
            <div
              className="md:hidden fixed inset-0 bg-black/50 z-30"
              onClick={() => setMobilePanelOpen(false)}
            />
          )}

          <div className={`w-full md:w-[420px] bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0 ${mobilePanelOpen ? "flex" : "hidden md:flex"} fixed md:relative inset-y-0 left-0 z-40 md:z-auto transition-transform duration-300 ${mobilePanelOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
            <div className="p-4 space-y-4 w-full">
              <div className="md:hidden flex justify-end mb-2">
                <button
                  onClick={() => setMobilePanelOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wand2 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">
                    Create Your Infographic
                  </h3>
                </div>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>Paste content or upload an image</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>Select your aspect ratio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>Choose the purpose of your infographic</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">4</span>
                    <span>Click Generate and download</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  {[
                    { id: "text", icon: FileText, label: "Text" },
                    { id: "image", icon: ImageIcon, label: "Image" },
                    { id: "image-url", icon: Globe, label: "URL" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setInputType(mode.id as any);
                        setInput("");
                        setImageFile(null);
                        setImageUrl("");
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${inputType === mode.id ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      <mode.icon className="w-3.5 h-3.5" />
                      {mode.label}
                    </button>
                  ))}
                </div>

                {inputType === "text" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Paste your content
                    </label>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Paste notes, articles, reports, blog posts, research, scripts..."
                      rows={8}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                )}

                {inputType === "image" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Upload an image
                    </label>
                    <div
                      className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
                      onClick={() =>
                        document.getElementById("image-upload")?.click()
                      }
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">
                        Drop an image here or click to browse
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG, WEBP up to 10MB
                      </p>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handleImageUpload(e.target.files[0])
                        }
                      />
                    </div>
                  </div>
                )}

                {inputType === "image-url" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      URL
                    </label>
                    <input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400">
                      Paste any image URL - AI will analyze it
                    </p>
                  </div>
                )}

                {/* Purpose Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    What is the purpose? {purpose && <span className="text-blue-600">({PURPOSES.find(p => p.id === purpose)?.label})</span>}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PURPOSES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPurpose(p.id)}
                        className={`p-2.5 rounded-xl text-xs border-2 transition-all text-left ${
                          purpose === p.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="text-base mb-1">{p.icon}</div>
                        <div className="font-medium text-gray-900">{p.label}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                  <div className="space-y-4 py-6">
                    <div className="text-center mb-4">
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      >
                        <Zap className="w-8 h-8 text-white" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        AI is Creating
                      </h3>
                      <p className="text-gray-500 text-sm">{loadingMessage}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Progress</span>
                        <span>{generationProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <motion.div
                          className="bg-gradient-to-r from-blue-600 to-purple-600 h-full rounded-full"
                          animate={{ width: `${generationProgress}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {generationSteps.map((step) => (
                        <div
                          key={step.id}
                          className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                            generationStep === step.id
                              ? "bg-blue-50 border border-blue-200"
                              : generationStep > step.id
                                ? "bg-green-50 opacity-60"
                                : "bg-gray-50 opacity-40"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                            generationStep === step.id
                              ? "bg-blue-600 text-white"
                              : generationStep > step.id
                                ? "bg-green-500 text-white"
                                : "bg-gray-300 text-gray-500"
                          }`}>
                            {generationStep > step.id ? "✓" : step.icon}
                          </div>
                          <span className={`text-sm font-medium ${
                            generationStep === step.id ? "text-blue-700" : "text-gray-600"
                          }`}>
                            {step.label}
                          </span>
                          {generationStep === step.id && (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600 ml-auto" />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}

                {/* Aspect Ratio Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    Aspect Ratio
                    <button
                      onClick={() => setShowAspectRatioModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 ml-auto"
                    >
                      Change
                    </button>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {aspectRatio.label}
                    </span>
                    <span className="text-sm text-gray-400">
                      {aspectRatio.width} × {aspectRatio.height}px
                    </span>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="truncate">{loadingMessage}</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      Generate Infographic ✨
                    </>
                  )}
                </button>

                {generatedHtml && !isLoading && (
                  <button
                    onClick={() => setShowExport(true)}
                    className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download Infographic
                  </button>
                )}

                <button
                  onClick={() => setMobilePanelOpen(false)}
                  className="md:hidden w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  View Canvas
                </button>
              </div>
            </div>
          </div>

          {/* Main Canvas */}
          <main className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center relative">
            {!mobilePanelOpen && !generatedHtml && (
              <button
                onClick={() => setMobilePanelOpen(true)}
                className="md:hidden fixed bottom-6 right-6 z-20 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center"
                title="Create"
              >
                <Wand2 className="w-6 h-6" />
              </button>
            )}
            <div className="flex items-center justify-center min-h-full w-full p-2 sm:p-4">
              {generatedHtml ? (
                <div
                  ref={canvasRef}
                  className="shadow-2xl rounded-lg overflow-hidden w-full"
                  style={{ maxWidth: "100%" }}
                >
                  <AIDesignRenderer
                    html={currentHtml || generatedHtml}
                    aspectRatio={aspectRatio}
                  />
                </div>
              ) : (
                <div className="text-center max-w-md px-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200/30">
                    <Wand2 className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
                    Ready to Create
                  </h2>
                  <p className="text-sm sm:text-base text-gray-500 leading-relaxed mb-4">
                    Paste your content, choose a purpose and aspect ratio, then generate.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Brain className="w-4 h-4" /> AI Powered
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Download className="w-4 h-4" /> Multiple Formats
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Instant
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Purpose Dialog Modal */}
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
              className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  🎯 What is the purpose of this infographic?
                </h2>
                <button
                  onClick={() => setShowPurposeDialog(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                This helps AI design the perfect layout, colors, and style for your needs.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {PURPOSES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPurpose(p.id);
                      setShowPurposeDialog(false);
                    }}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="text-2xl mb-2">{p.icon}</div>
                    <div className="font-semibold text-gray-900">{p.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{p.desc}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowPurposeDialog(false)}
                className="w-full mt-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
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
              className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" /> Settings
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-5">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        API Keys are stored locally in your browser only.
                      </p>
                      <p className="text-xs text-blue-600 mt-0.5">
                        They are never sent to our servers.
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    AI Provider
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {providers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setActiveProvider(p.id)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-medium border-2 transition-all ${activeProvider === p.id ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm" : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"}`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
                {providers
                  .filter((p) => p.id === activeProvider)
                  .map((provider) => (
                    <React.Fragment key={provider.id}>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">
                          API Key
                        </label>
                        <input
                          type="password"
                          value={provider.apiKey}
                          onChange={(e) =>
                            setProvider({ ...provider, apiKey: e.target.value })
                          }
                          placeholder={`Enter your ${provider.name} API key...`}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <a
                          href={
                            AI_PROVIDERS.find((p) => p.id === provider.id)
                              ?.docsUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-700 mt-1.5 inline-block"
                        >
                          Get your API key →
                        </a>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">
                          Model
                        </label>
                        <select
                          value={provider.model}
                          onChange={(e) =>
                            setProvider({ ...provider, model: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {(
                            AI_PROVIDERS.find((p) => p.id === provider.id)
                              ?.models || []
                          ).map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1.5">
                            Temperature: {provider.temperature}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={provider.temperature}
                            onChange={(e) =>
                              setProvider({
                                ...provider,
                                temperature: parseFloat(e.target.value),
                              })
                            }
                            className="w-full accent-blue-600"
                          />
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Precise</span>
                            <span>Creative</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1.5">
                            Max Tokens: {provider.maxTokens}
                          </label>
                          <input
                            type="range"
                            min="256"
                            max="4096"
                            step="256"
                            value={provider.maxTokens}
                            onChange={(e) =>
                              setProvider({
                                ...provider,
                                maxTokens: parseInt(e.target.value),
                              })
                            }
                            className="w-full accent-blue-600"
                          />
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>256</span>
                            <span>4096</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                        <p className="text-xs text-amber-700">
                          💡 <strong>Tip:</strong> Lower max tokens (256-1024) uses fewer credits.
                        </p>
                      </div>
                    </React.Fragment>
                  ))}
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                >
                  Done
                </button>
              </div>
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
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Layout className="w-5 h-5 text-blue-600" /> Select Aspect Ratio
                </h2>
                <button
                  onClick={() => setShowAspectRatioModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(ASPECT_RATIOS).map(([key, ratio]) => (
                    <button
                      key={key}
                      onClick={() => {
                        if (ratio.id === "custom") {
                          setAspectRatioState(ratio);
                        } else {
                          setAspectRatioState(ratio);
                          setShowAspectRatioModal(false);
                        }
                      }}
                      className={`p-4 border-2 rounded-xl hover:border-blue-500 transition-colors text-center ${aspectRatio.id === ratio.id ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                    >
                      <div className="font-medium text-gray-900">
                        {ratio.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {ratio.id === "custom" ? "Custom dimensions" : `${ratio.width} × ${ratio.height}px`}
                      </div>
                    </button>
                  ))}
                </div>

                {aspectRatio.id === "custom" && (
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-800">Custom Size</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          Width (px)
                        </label>
                        <input
                          type="number"
                          value={customWidth}
                          onChange={(e) =>
                            setCustomWidth(
                              Math.max(
                                100,
                                Math.min(5000, parseInt(e.target.value) || 800),
                              ),
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="100"
                          max="5000"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          Height (px)
                        </label>
                        <input
                          type="number"
                          value={customHeight}
                          onChange={(e) =>
                            setCustomHeight(
                              Math.max(
                                100,
                                Math.min(5000, parseInt(e.target.value) || 800),
                              ),
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="100"
                          max="5000"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setAspectRatioState({
                          ...aspectRatio,
                          width: customWidth,
                          height: customHeight,
                        });
                        setShowAspectRatioModal(false);
                      }}
                      className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Apply Custom Size
                    </button>
                  </div>
                )}
              </div>
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
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Download className="w-5 h-5" /> Export Infographic
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleExport("png")}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors text-center"
                >
                  <FileImage className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="font-medium text-gray-900">PNG</div>
                  <div className="text-xs text-gray-500">High quality image</div>
                </button>
                <button
                  onClick={() => handleExport("jpg")}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 transition-colors text-center"
                >
                  <FileImage className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="font-medium text-gray-900">JPG</div>
                  <div className="text-xs text-gray-500">Compressed image</div>
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-red-500 transition-colors text-center"
                >
                  <FileText className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <div className="font-medium text-gray-900">PDF</div>
                  <div className="text-xs text-gray-500">Print-ready document</div>
                </button>
                <button
                  onClick={() => handleExport("json")}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-orange-500 transition-colors text-center"
                >
                  <FileJson className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="font-medium text-gray-900">JSON</div>
                  <div className="text-xs text-gray-500">Project data</div>
                </button>
              </div>
              <button
                onClick={() => setShowExport(false)}
                className="w-full mt-6 py-3 bg-gray-100 rounded-xl text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function generateBlankHtml(content: InfographicContent, theme: any): string {
  const bgColor = theme?.colors?.background || "#ffffff";
  const textColor = theme?.colors?.text || "#0f172a";
  const accentColor = theme?.colors?.accent || "#3b82f6";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Inter, system-ui, sans-serif; overflow: hidden; color: ${textColor}; }
    .container { width: 1080px; height: 1080px; background: ${bgColor}; padding: 40px; display: flex; flex-direction: column; gap: 20px; position: relative; }
    h1 { font-size: 42px; font-weight: 800; margin-bottom: 8px; line-height: 1.15; }
    .subtitle { font-size: 18px; opacity: 0.7; line-height: 1.4; }
    .stats { display: flex; gap: 12px; margin-top: 8px; }
    .stat { flex: 1; background: rgba(0,0,0,0.03); border-radius: 12px; padding: 16px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: 700; color: ${accentColor}; }
    .stat-label { font-size: 13px; opacity: 0.6; margin-top: 4px; }
    .sections { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; flex: 1; }
    .section { background: rgba(0,0,0,0.02); border-radius: 12px; padding: 20px; border: 1px solid rgba(0,0,0,0.06); }
    .section h3 { font-size: 16px; font-weight: 700; color: ${accentColor}; margin-bottom: 8px; }
    .section p { font-size: 14px; line-height: 1.6; opacity: 0.8; }
    .cta { text-align: center; margin-top: auto; }
    .cta span { display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, ${accentColor}, #7c3aed); color: white; border-radius: 10px; font-size: 16px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div>
      <h1>${content.title}</h1>
      ${content.subtitle ? `<p class="subtitle">${content.subtitle}</p>` : ""}
    </div>
    ${
      content.statistics.length > 0
        ? `
    <div class="stats">
      ${content.statistics
        .slice(0, 4)
        .map(
          (s) => `
        <div class="stat">
          <div class="stat-value">${s.prefix || ""}${s.value}${s.suffix || ""}</div>
          <div class="stat-label">${s.label}</div>
        </div>
      `,
        )
        .join("")}
    </div>`
        : ""
    }
    ${
      content.sections.length > 0
        ? `
    <div class="sections">
      ${content.sections
        .slice(0, 4)
        .map(
          (s) => `
        <div class="section">
          <h3>${s.icon || ""} ${s.title}</h3>
          <p>${s.content}</p>
        </div>
      `,
        )
        .join("")}
    </div>`
        : ""
    }
  </div>
</body>
</html>`;
}