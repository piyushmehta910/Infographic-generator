"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, Plug, Loader2, CheckCircle2, AlertCircle, ChevronDown, FileText,
  Palette, Code2, Zap, RotateCcw, Save, Eye, EyeOff, ShieldCheck, Globe,
  Sparkles, Flame, Wrench, Cpu, Thermometer, Layers, KeyRound,
  ExternalLink, Settings, Check,
} from "lucide-react";
import { useAIStore } from "@/stores/aiStore";
import { AI_PROVIDERS } from "@/lib/constants";
import { DEFAULT_PROMPTS, type CustomPrompts } from "@/services/ai/promptBuilder";

interface ProviderSettingsProps {
  open: boolean;
  onClose: () => void;
}

/* Per-provider visual identity (icon + accent colors) for the picker cards. */
const PROVIDER_META: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; active: string; chip: string }
> = {
  openrouter: {
    icon: Globe,
    active: "border-violet-400/70 bg-violet-500/10 shadow-[0_8px_30px_-10px_rgba(139,92,246,0.55)]",
    chip: "border-violet-400/30 bg-violet-500/15 text-violet-200",
  },
  gemini: {
    icon: Sparkles,
    active: "border-sky-400/70 bg-sky-500/10 shadow-[0_8px_30px_-10px_rgba(56,189,248,0.55)]",
    chip: "border-sky-400/30 bg-sky-500/15 text-sky-200",
  },
  groq: {
    icon: Zap,
    active: "border-orange-400/70 bg-orange-500/10 shadow-[0_8px_30px_-10px_rgba(251,146,60,0.55)]",
    chip: "border-orange-400/30 bg-orange-500/15 text-orange-200",
  },
  nim: {
    icon: Cpu,
    active: "border-emerald-400/70 bg-emerald-500/10 shadow-[0_8px_30px_-10px_rgba(16,185,129,0.55)]",
    chip: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
  },
  mistral: {
    icon: Flame,
    active: "border-amber-400/70 bg-amber-500/10 shadow-[0_8px_30px_-10px_rgba(251,191,36,0.55)]",
    chip: "border-amber-400/30 bg-amber-500/15 text-amber-200",
  },
  custom: {
    icon: Wrench,
    active: "border-cyan-400/70 bg-cyan-500/10 shadow-[0_8px_30px_-10px_rgba(34,211,238,0.55)]",
    chip: "border-cyan-400/30 bg-cyan-500/15 text-cyan-200",
  },
};
/* Shared building blocks ------------------------------------------------- */

function FieldLabel({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">
      <Icon className="w-3.5 h-3.5 text-brand-300" />
      {children}
    </span>
  );
}

function SliderField({
  icon: Icon,
  label,
  value,
  min,
  max,
  step,
  onChange,
  minLabel,
  maxLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  minLabel: string;
  maxLabel: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-navy-950/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-surface-400">
          <Icon className="w-3.5 h-3.5 text-brand-300" />
          {label}
        </span>
        <span className="px-2 py-0.5 rounded-md bg-brand-500/15 border border-brand-400/30 text-[11px] font-bold text-brand-200 tabular-nums">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="range-brand w-full"
        aria-label={label}
      />
      <div className="flex justify-between text-[10px] text-surface-500 mt-1.5">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

export default function ProviderSettings({ open, onClose }: ProviderSettingsProps) {
  const { providers, activeProvider, setProvider, setActiveProvider, customPrompts, setCustomPrompts } = useAIStore();
  const [testing, setTesting] = useState(false);
  const [promptsOpen, setPromptsOpen] = useState(false);
  const [drafts, setDrafts] = useState<CustomPrompts>({});
  const [promptsSaved, setPromptsSaved] = useState(false);
  const [freeOnly, setFreeOnly] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [dynamicModels, setDynamicModels] = useState<Record<string, any[]>>({});
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Fetch live free models from /api/models for active provider
  useEffect(() => {
    if (!open) return;
    const fetchLiveModels = async () => {
      try {
        const res = await fetch(`/api/models?provider=${activeProvider}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.models) && data.models.length > 0) {
          setDynamicModels((prev) => ({ ...prev, [activeProvider]: data.models }));
        }
      } catch {
        // Fall back to static constants silently
      }
    };
    fetchLiveModels();
  }, [open, activeProvider]);

  // Escape closes the dialog; focus moves into it while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // A stale "Connected" banner must never leak across provider switches.
  useEffect(() => {
    setTestResult(null);
    setTesting(false);
    setShowKey(false);
  }, [activeProvider]);

  // Sync prompt drafts from the store each time the dialog opens.
  useEffect(() => {
    if (open) {
      setDrafts({ ...customPrompts });
      setPromptsSaved(false);
    }
  }, [open, customPrompts]);

  const runTest = async () => {
    if (!active || !active.apiKey) {
      setTestResult({ ok: false, message: "Enter an API key first, then test." });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/test-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: active.id,
          apiKey: active.apiKey,
          model: active.model,
          baseUrl: active.baseUrl,
        }),
      });
      const data = await res.json();
      setTestResult(
        data.success
          ? { ok: true, message: `Connected (${data.ms}ms). Reply: "${(data.sample || "…").slice(0, 60)}"` }
          : { ok: false, message: data.error || "Connection failed." },
      );
    } catch {
      setTestResult({ ok: false, message: "Could not reach the test endpoint." });
    } finally {
      setTesting(false);
    }
  };

  const updateCustom = (field: string, value: string | number) => {
    setProvider({ ...(active as any), [field]: value });
  };

  // --- System prompt editing ---
  const PROMPT_FIELDS: { id: keyof CustomPrompts; label: string; icon: React.ComponentType<{ className?: string }>; hint: string }[] = [
    { id: "content", label: "Phase 1 · Content", icon: FileText, hint: "Polishes & structures your input" },
    { id: "design", label: "Phase 2 · Art Direction", icon: Palette, hint: "Invents palette, fonts & layout" },
    { id: "html", label: "Phase 3 · HTML/CSS", icon: Code2, hint: "Codes the final infographic" },
    { id: "singleShot", label: "Fallback · Single-Shot", icon: Zap, hint: "Used if the 3-phase pipeline fails" },
  ];

  const getDraft = (id: keyof CustomPrompts) => drafts[id] ?? DEFAULT_PROMPTS[id];
  const isModified = (id: keyof CustomPrompts) =>
    drafts[id] !== undefined && drafts[id] !== DEFAULT_PROMPTS[id];

  const editDraft = (id: keyof CustomPrompts, value: string) => {
    setDrafts((d) => ({ ...d, [id]: value }));
    setPromptsSaved(false);
  };

  const resetDraft = (id: keyof CustomPrompts) => {
    setDrafts((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
    setPromptsSaved(false);
  };

  const savePrompts = () => {
    // Only persist values that differ from the defaults, so future default
    // improvements still flow through to untouched phases.
    const overrides: CustomPrompts = {};
    for (const { id } of PROMPT_FIELDS) {
      const v = drafts[id];
      if (v !== undefined && v !== DEFAULT_PROMPTS[id]) overrides[id] = v;
    }
    setCustomPrompts(overrides);
    setPromptsSaved(true);
  };

  const active = providers.find((p) => p.id === activeProvider);
  const modelsList = active ? dynamicModels[active.id] || AI_PROVIDERS.find((p) => p.id === active.id)?.models || [] : [];
  const currentModelInfo = active ? modelsList.find((m) => m.id === active.model) : undefined;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="settings-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="provider-settings-title"
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="relative w-full max-w-xl bg-navy-900/90 border border-white/10 rounded-2xl shadow-[0_24px_80px_-16px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient accent line */}
            <div className="h-1 bg-brand-gradient flex-shrink-0" aria-hidden="true" />

            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 flex-shrink-0">
              <span className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-brand-500/25 flex-shrink-0">
                <Settings className="w-5 h-5 text-white" />
              </span>
              <div className="flex-1 min-w-0">
                <h2 id="provider-settings-title" className="text-base font-bold text-white leading-tight">
                  Settings
                </h2>
                <p className="text-[11px] text-surface-400">AI provider, model &amp; prompt configuration</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close settings"
                className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="modal-scroll flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Security notice */}
              <div className="flex items-start gap-3 rounded-xl border border-brand-400/20 bg-brand-950/30 px-4 py-3">
                <ShieldCheck className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-brand-100">Keys stay on this device</p>
                  <p className="text-xs text-surface-400 mt-0.5">
                    Stored in your browser&apos;s local storage — never sent to our servers.
                  </p>
                </div>
              </div>

              {/* Provider picker */}
              <section>
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-surface-400 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-brand-300" /> AI Provider
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {providers.map((p) => {
                    const meta = PROVIDER_META[p.id] ?? PROVIDER_META.custom;
                    const Icon = meta.icon;
                    const isActive = activeProvider === p.id;
                    const hasKey = Boolean(p.apiKey);
                    return (
                      <button
                        key={p.id}
                        onClick={() => setActiveProvider(p.id)}
                        aria-pressed={isActive}
                        className={`relative group flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all duration-200 ${
                          isActive
                            ? `${meta.active} text-white`
                            : "border-white/10 bg-white/[0.02] text-surface-300 hover:border-white/20 hover:bg-white/[0.05] hover:-translate-y-0.5"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-navy-900">
                            <Check className="w-3 h-3" strokeWidth={3.5} />
                          </span>
                        )}
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                            isActive
                              ? meta.chip
                              : "border-white/10 bg-white/5 text-surface-400 group-hover:text-surface-200"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-semibold leading-tight pr-4">{p.name}</span>
                        <span className="flex items-center gap-1.5 text-[10px] text-surface-500">
                          <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${hasKey ? "bg-emerald-400" : "bg-surface-600"}`} />
                          {hasKey ? "Key saved" : "No key"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Active provider configuration */}
              {active && (
                <section className="rounded-xl border border-white/10 bg-surface-950/40 p-4 sm:p-5 space-y-5">
                  {active.id === "custom" && (
                    <>
                      <div>
                        <FieldLabel icon={Wrench}>Provider Name</FieldLabel>
                        <input
                          type="text"
                          value={active.name}
                          onChange={(e) => updateCustom("name", e.target.value)}
                          placeholder="My Custom Provider"
                          aria-label="Provider name"
                          className="w-full px-4 py-2.5 bg-navy-950 border border-white/10 rounded-xl text-sm text-surface-100 placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-400/60 focus:border-brand-400/40 transition"
                        />
                      </div>
                      <div>
                        <FieldLabel icon={Globe}>API Base URL</FieldLabel>
                        <input
                          type="text"
                          value={active.baseUrl || ""}
                          onChange={(e) => updateCustom("baseUrl", e.target.value)}
                          placeholder="https://api.example.com/v1"
                          aria-label="API base URL"
                          className="w-full px-4 py-2.5 bg-navy-950 border border-white/10 rounded-xl text-sm font-mono text-surface-100 placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-400/60 focus:border-brand-400/40 transition"
                        />
                        <p className="text-[11px] text-surface-500 mt-1.5">
                          Point to the API root, e.g. https://openrouter.ai/api/v1
                        </p>
                      </div>
                    </>
                  )}

                  {/* API key with show/hide */}
                  <div>
                    <FieldLabel icon={KeyRound}>API Key</FieldLabel>
                    <div className="relative">
                      <input
                        type={showKey ? "text" : "password"}
                        value={active.apiKey}
                        onChange={(e) =>
                          active.id === "custom"
                            ? updateCustom("apiKey", e.target.value)
                            : setProvider({ ...active, apiKey: e.target.value })
                        }
                        placeholder={`Enter your ${active.id === "custom" ? "provider" : active.name} API key…`}
                        aria-label="API key"
                        className="w-full pl-10 pr-11 py-2.5 bg-navy-950 border border-white/10 rounded-xl text-sm font-mono text-surface-100 placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-400/60 focus:border-brand-400/40 transition"
                      />
                      <KeyRound className="w-4 h-4 text-surface-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowKey((v) => !v)}
                        aria-label={showKey ? "Hide API key" : "Show API key"}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-surface-500 hover:text-surface-200 hover:bg-white/5 transition-colors"
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2.5">
                      {active.id !== "custom" && (
                        <a
                          href={AI_PROVIDERS.find((p) => p.id === active.id)?.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand-300 hover:text-brand-200 transition-colors"
                        >
                          Get your API key <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        onClick={runTest}
                        disabled={testing}
                        className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-500/15 border border-brand-400/30 text-brand-200 hover:bg-brand-500/25 hover:border-brand-400/50 disabled:opacity-50 transition-all"
                      >
                        {testing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plug className="w-3.5 h-3.5" />
                        )}
                        {testing ? "Testing…" : "Test connection"}
                      </button>
                    </div>
                    {testResult && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`mt-3 flex items-start gap-2 text-xs px-3 py-2.5 rounded-lg border ${
                          testResult.ok
                            ? "bg-emerald-900/20 border-emerald-400/30 text-emerald-300"
                            : "bg-red-900/20 border-red-400/30 text-red-300"
                        }`}
                      >
                        {testResult.ok ? (
                          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        )}
                        <span className="leading-relaxed">{testResult.message}</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Model */}
                  {active.id === "custom" ? (
                    <div>
                      <FieldLabel icon={Cpu}>Model Name</FieldLabel>
                      <input
                        type="text"
                        value={active.model}
                        onChange={(e) => updateCustom("model", e.target.value)}
                        placeholder="e.g. gpt-4o-mini"
                        aria-label="Model name"
                        className="w-full px-4 py-2.5 bg-navy-950 border border-white/10 rounded-xl text-sm font-mono text-surface-100 placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-400/60 focus:border-brand-400/40 transition"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-surface-400">
                          <Cpu className="w-3.5 h-3.5 text-brand-300" /> Model
                        </span>
                        <button
                          type="button"
                          onClick={() => setFreeOnly(!freeOnly)}
                          aria-pressed={freeOnly}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                            freeOnly
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/40"
                              : "bg-white/5 text-surface-400 border-white/10 hover:text-surface-200"
                          }`}
                        >
                          {freeOnly ? (
                            <>
                              <Check className="w-3 h-3" strokeWidth={3} /> Free models only
                            </>
                          ) : (
                            "Show all models"
                          )}
                        </button>
                      </div>
                      <div className="relative">
                        <select
                          value={active.model}
                          onChange={(e) => setProvider({ ...active, model: e.target.value })}
                          aria-label="Model"
                          className="w-full appearance-none px-4 py-2.5 pr-10 bg-navy-950 border border-white/10 rounded-xl text-sm text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-400/60 focus:border-brand-400/40 transition cursor-pointer"
                          style={{ colorScheme: "dark" }}
                        >
                          {modelsList
                            .filter((m) => !freeOnly || m.isFree !== false)
                            .map((model) => (
                              <option key={model.id} value={model.id}>
                                {model.name} {model.isFree ? "— Free" : ""}
                              </option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-surface-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                      {currentModelInfo?.description && (
                        <p className="text-xs text-surface-400 mt-2 leading-relaxed bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                          <span className="text-brand-300 font-medium">Model info: </span>
                          {currentModelInfo.description}
                        </p>
                      )}
                      <div className="mt-2.5 text-[11px] text-surface-400 bg-brand-950/40 border border-brand-500/20 p-2.5 rounded-lg flex items-start gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-300 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-surface-200">Auto-failover:</strong> if this model is busy or
                          rate-limited, the system automatically retries the next free model or backup provider
                          with no interruption.
                        </span>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Generation sliders */}
              {active && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <SliderField
                    icon={Thermometer}
                    label="Temperature"
                    value={active.temperature}
                    min={0}
                    max={2}
                    step={0.1}
                    onChange={(v) => updateCustom("temperature", v)}
                    minLabel="Precise"
                    maxLabel="Creative"
                  />
                  <SliderField
                    icon={Layers}
                    label="Max Tokens"
                    value={active.maxTokens}
                    min={256}
                    max={4096}
                    step={256}
                    onChange={(v) => updateCustom("maxTokens", v)}
                    minLabel="256"
                    maxLabel="4096"
                  />
                </div>
              )}

              {/* System prompts (editable) */}
              <div className="rounded-xl border border-white/10 bg-surface-900/50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPromptsOpen((o) => !o)}
                  aria-expanded={promptsOpen}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.03] transition-colors"
                >
                  <span className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-400/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-brand-300" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-white">System Prompts</span>
                    <span className="block text-[11px] text-surface-400">
                      Fine-tune the AI instructions for each pipeline phase
                    </span>
                  </span>
                  {Object.keys(customPrompts).length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-400/30 flex-shrink-0">
                      {Object.keys(customPrompts).length} customized
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-surface-400 transition-transform flex-shrink-0 ${promptsOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {promptsOpen && (
                    <motion.div
                      key="prompt-editor"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden border-t border-white/5"
                    >
                      <div className="px-4 pb-4 pt-3 space-y-3">
                        <p className="text-[11px] text-surface-400 leading-relaxed">
                          These are the exact system prompts sent to the AI for each phase. Edit any of them to
                          steer the output — your changes are saved locally and used on the next generation.
                          <span className="text-surface-500"> Defaults are shown as the starting text.</span>
                        </p>

                        {PROMPT_FIELDS.map(({ id, label, icon: Icon, hint }) => {
                          const modified = isModified(id);
                          return (
                            <div key={id} className="rounded-lg border border-white/5 bg-surface-950/60">
                              <div className="flex items-center gap-2 px-3 pt-2.5">
                                <Icon className="w-3.5 h-3.5 text-brand-300 flex-shrink-0" />
                                <span className="text-xs font-semibold text-surface-100">{label}</span>
                                {modified && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-amber-500/15 text-amber-300 border border-amber-400/30">
                                    edited
                                  </span>
                                )}
                                <span className="ml-auto text-[10px] text-surface-500 hidden sm:block truncate">{hint}</span>
                                <button
                                  type="button"
                                  onClick={() => resetDraft(id)}
                                  disabled={!modified}
                                  title="Reset this phase to the default prompt"
                                  className="ml-auto sm:ml-2 p-1.5 rounded-md text-surface-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all flex-shrink-0"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <textarea
                                value={getDraft(id)}
                                onChange={(e) => editDraft(id, e.target.value)}
                                rows={6}
                                spellCheck={false}
                                className="w-full mx-0 mt-2 px-3 py-2.5 bg-transparent border-t border-white/5 text-[11px] leading-relaxed text-surface-200 font-mono resize-y focus:outline-none focus:bg-white/[0.02] placeholder:text-surface-600"
                                placeholder={DEFAULT_PROMPTS[id]}
                                aria-label={`${label} system prompt`}
                              />
                            </div>
                          );
                        })}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={savePrompts}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-500/20 border border-brand-400/40 text-brand-200 hover:bg-brand-500/30 transition-all"
                          >
                            <Save className="w-3.5 h-3.5" /> Save Prompts
                          </button>
                          <button
                            type="button"
                            onClick={() => setDrafts({})}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-surface-300 hover:text-white hover:bg-white/5 transition-all"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Reset All
                          </button>
                          {promptsSaved && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300 font-medium"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Saved — used on next generation
                            </motion.span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-white/5 bg-navy-950/60 flex-shrink-0">
              <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-surface-500">
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-sans text-[10px] text-surface-400">
                  Esc
                </kbd>
                to close
              </span>
              <button
                onClick={onClose}
                className="btn-sheen flex-1 sm:flex-none sm:ml-auto px-10 py-2.5 bg-brand-gradient text-white rounded-xl text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}









