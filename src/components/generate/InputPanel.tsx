"use client";

  import { Brain, Sparkles } from "lucide-react";
  import { Button } from "@/components/ui/Button";

  export type InputTab = "text";

  interface InputPanelProps {
    input: string;
    setInput: (v: string) => void;
    onGenerateClick: () => void;
    isGenerating: boolean;
  }

  const inputFieldClass =
    "w-full px-4 py-3 rounded-xl bg-surface-800/60 border border-white/10 text-surface-100 placeholder-surface-400/70 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none";

  export default function InputPanel(p: InputPanelProps) {
    const { input, setInput, onGenerateClick, isGenerating } = p;

    const canGenerate = Boolean(input) && input.trim().length > 0;

    return (
      <div className="w-80 flex-shrink-0 flex flex-col h-screen border-r border-white/5 bg-surface-900/80">
        <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-brand-900/40">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-display font-bold text-white leading-tight">Create Infographic</h1>
              <p className="text-[11px] text-surface-400 leading-tight">AI designs unique visuals from your content</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="infographic-input" className="text-xs font-medium text-surface-200">
                Your Content
              </label>
              <span
                aria-live="polite"
                className={`text-[10px] ${input.length >= 7000 ? "text-amber-400 font-semibold" : "text-surface-500"}`}
              >
                {input.length}/8000
              </span>
            </div>
            <textarea
              id="infographic-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste a blog post, article, or describe your idea..."
              rows={5}
              maxLength={8000}
              className={inputFieldClass}
            />
          </div>

          <div className="pt-1">
            <Button
              variant="primary"
              className="w-full h-12"
              disabled={!canGenerate || isGenerating}
              onClick={onGenerateClick}
            >
              {isGenerating ? (
                <>Generating…</>
              ) : (
                <><Brain className="w-5 h-5" /> Generate Infographic</>
              )}
            </Button>
            {!canGenerate && !isGenerating && (
              <p className="text-[11px] text-surface-500 mt-2 text-center">
                Paste or type some content above to enable generation.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
