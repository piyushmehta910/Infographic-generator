"use client";

import {
  Sparkles,
  Brain,
  Type,
  Ruler,
  SlidersHorizontal,
  Settings2,
  AlertCircle,
  Key,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AspectRatio } from "@/lib/types";
import { ASPECT_RATIOS, DESIGN_INTENTS } from "@/lib/constants";

interface InputPanelProps {
  input: string;
  setInput: (v: string) => void;
  onGenerateClick: () => void;
  isGenerating: boolean;
  aspectRatio: AspectRatio;
  setAspectRatio: (ar: AspectRatio) => void;
  designIntent: string;
  setDesignIntent: (v: string) => void;
  onOpenSettings: () => void;
  hasApiKey: boolean;
  hasExistingHtml?: boolean;
}

/** Popular canvas sizes surfaced as one-tap presets. */
const SIZES = [
  { id: "1:1", label: "Square", sub: "1:1" },
  { id: "4:5", label: "Post", sub: "4:5" },
  { id: "9:16", label: "Story", sub: "9:16" },
  { id: "16:9", label: "Banner", sub: "16:9" },
  { id: "A4-P", label: "A4", sub: "Portrait" },
  { id: "letter", label: "Letter", sub: "Doc" },
];

export default function InputPanel(p: InputPanelProps) {
  const {
    input,
    setInput,
    onGenerateClick,
    isGenerating,
    aspectRatio,
    setAspectRatio,
    designIntent,
    setDesignIntent,
    onOpenSettings,
    hasApiKey,
    hasExistingHtml = false,
  } = p;

  const canGenerate = Boolean(input) && input.trim().length > 0;
  const currentSize = ASPECT_RATIOS[aspectRatio.id] || aspectRatio;
  const readyToGenerate = canGenerate && hasApiKey;

  return (
    <aside className="w-84 flex-shrink-0 flex flex-col h-full overflow-hidden border-r border-white/5 bg-surface-900/80">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-brand-900/40">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-display font-bold text-white leading-tight truncate">InfoGraphic AI</h1>
            <p className="text-[11px] text-surface-400 leading-tight truncate">Intelligent Visual Studio</p>
          </div>
        </div>
      </div>

      {/* Main Form Views */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
        {/* Content input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="infographic-input" className="text-xs font-medium text-surface-200 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-brand-400" /> Topic or Source Text
            </label>
            <span
              aria-live="polite"
              className={`text-[10px] tabular-nums ${input.length >= 7000 ? "text-amber-400 font-semibold" : "text-surface-500"}`}
            >
              {input.length}/8000
            </span>
          </div>
          <textarea
            id="infographic-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste an article, key facts, or describe a topic (AI will assess, expand, and structure it)..."
            rows={6}
            maxLength={8000}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800/60 border border-white/10 text-sm text-surface-100 placeholder-surface-400/70 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none leading-relaxed"
          />
        </div>

        {/* Popular sizes */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-surface-200 flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5 text-brand-400" /> Size & Orientation
            <span className="text-[10px] font-normal text-surface-500 ml-auto">
              {currentSize.width}×{currentSize.height}
            </span>
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {SIZES.map((s) => {
              const ar = ASPECT_RATIOS[s.id];
              const active = aspectRatio.id === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => ar && setAspectRatio(ar)}
                  aria-pressed={active}
                  className={`px-2 py-2 rounded-xl border text-center transition-all touch-target ${
                    active
                      ? "border-brand-400 bg-brand-900/30 text-white"
                      : "border-surface-600/60 hover:border-surface-500 text-surface-300"
                  }`}
                >
                  <div className="text-xs font-semibold leading-tight">{s.label}</div>
                  <div className="text-[10px] text-surface-500 leading-tight">{s.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Design intent */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-surface-200 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-brand-400" /> Design Mood
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DESIGN_INTENTS.map((d) => {
              const active = designIntent === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDesignIntent(d.id)}
                  aria-pressed={active}
                  title={d.desc}
                  className={`px-2.5 py-1.5 rounded-full text-[11px] font-medium border transition-all touch-target ${
                    active
                      ? "border-brand-400 bg-brand-900/40 text-white"
                      : "border-surface-600/60 text-surface-300 hover:border-surface-500"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* API key status */}
        {!hasApiKey && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-900/30 border border-amber-400/30 animate-pulse">
            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-amber-200">API Key Required</p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Add an API key in Settings to enable generation.
              </p>
              <button
                type="button"
                onClick={onOpenSettings}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 border border-amber-400/40 text-amber-200 hover:bg-amber-500/30 transition-all"
              >
                <Key className="w-3.5 h-3.5" /> Open Settings & Add Key
              </button>
            </div>
          </div>
        )}
        {hasApiKey && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-surface-800/40 border border-white/5">
            <Settings2 className="w-4 h-4 text-surface-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-surface-400 leading-snug">
                Keys are stored safely in local browser storage.
              </p>
              <button
                type="button"
                onClick={onOpenSettings}
                className="mt-1 text-[11px] font-semibold text-brand-300 hover:text-brand-200"
              >
                Configure provider & model →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fixed footer with generate button */}
      <div className="px-4 py-3 border-t border-white/5">
        <Button
          variant="primary"
          className="w-full h-12"
          disabled={!readyToGenerate || isGenerating}
          onClick={onGenerateClick}
          title={!hasApiKey ? "Add an API key in Settings first" : !canGenerate ? "Enter some content to generate" : undefined}
        >
          {isGenerating ? (
            <>
              <Brain className="w-5 h-5 animate-pulse" /> Generating…
            </>
          ) : !hasApiKey ? (
            <>
              <Key className="w-5 h-5" /> Add API Key to Generate
            </>
          ) : hasExistingHtml ? (
            <>
              <RefreshCw className="w-5 h-5" /> Regenerate Infographic
            </>
          ) : (
            <>
              <Brain className="w-5 h-5" /> Generate Infographic
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}