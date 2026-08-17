"use client";

import { FileText, Globe, ImageIcon, Upload, Brain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Purpose, PURPOSES } from "@/lib/purposes";

export type InputTab = "text" | "url" | "image" | "data";

interface InputPanelProps {
  input: string;
  setInput: (v: string) => void;
  inputType: InputTab;
  setInputType: (t: InputTab) => void;
  imageUrl: string;
  setImageUrl: (v: string) => void;
  imageFile: File | null;
  setImageFile: (f: File | null) => void;
  purpose: Purpose;
  setPurpose: (p: Purpose) => void;
  userIntent: string;
  setUserIntent: (v: string) => void;
  onGenerateClick: () => void;
  isGenerating: boolean;
}

const INPUT_TABS: { id: InputTab; label: string; icon: React.ReactNode }[] = [
  { id: "text", label: "Text", icon: <FileText className="w-4 h-4" /> },
  { id: "url", label: "URL", icon: <Globe className="w-4 h-4" /> },
  { id: "image", label: "Image", icon: <ImageIcon className="w-4 h-4" /> },
  { id: "data", label: "CSV", icon: <Upload className="w-4 h-4" /> },
];

const inputFieldClass =
  "w-full px-4 py-3 rounded-xl bg-surface-800/60 border border-white/10 text-surface-100 placeholder-surface-400/70 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none";

export default function InputPanel(p: InputPanelProps) {
  const {
    input, setInput, inputType, setInputType, imageUrl, setImageUrl,
    imageFile, setImageFile, purpose, setPurpose, userIntent, setUserIntent,
    onGenerateClick, isGenerating,
  } = p;

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

        <div className="flex gap-1 bg-surface-800/60 p-1 rounded-xl">
          {INPUT_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setInputType(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium touch-target transition-all ${
                inputType === t.id ? "bg-brand-gradient text-white shadow" : "text-surface-300 hover:text-white"
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {inputType === "text" && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-200">Your Content</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste a blog post, article, or describe your idea..."
              rows={5}
              maxLength={8000}
              className={inputFieldClass}
            />
          </div>
        )}

        {inputType === "url" && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-200">Article URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full h-11 px-4 rounded-xl bg-surface-800/60 border border-white/10 text-surface-100 placeholder-surface-400/70 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <p className="text-[11px] text-surface-400">We fetch and summarize the page content client-side.</p>
          </div>
        )}

        {inputType === "image" && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-200">Upload Image</label>
            <label className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-surface-600 bg-surface-800/40 cursor-pointer hover:border-brand-400 transition-colors">
              <Upload className="w-5 h-5 text-surface-400 mb-1.5" />
              <span className="text-xs text-surface-400">
                {imageFile ? imageFile.name : "Click or drag to upload"}
              </span>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setImageFile(f);
                  setImageUrl("");
                  if (f) {
                    const r = new FileReader();
                    r.onload = () => setInput((r.result as string) || "");
                    r.readAsDataURL(f);
                  }
                  setInputType("image");
                }}
              />
            </label>
          </div>
        )}

        {inputType === "data" && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-200">Paste CSV data</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={"label,value\nRevenue,2.1M\nCosts,1.2M"}
              rows={4}
              className={inputFieldClass + " font-mono text-xs"}
            />
            <p className="text-[11px] text-surface-400">We auto-detect columns and map them to charts.</p>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-surface-200">Purpose</label>
          <div className="grid grid-cols-3 gap-1.5">
            {PURPOSES.map((pt) => (
              <button
                key={pt.id}
                onClick={() => setPurpose(pt.id)}
                title={pt.label}
                className={`py-1.5 px-1 rounded-lg text-center border transition-all touch-target ${
                  purpose === pt.id
                    ? "border-brand-400 bg-brand-900/30"
                    : "border-surface-700 hover:border-surface-500"
                }`}
              >
                <div className="text-base leading-none mb-0.5">{pt.icon}</div>
                <div className={`text-[10px] font-medium leading-tight truncate ${purpose === pt.id ? "text-white" : "text-surface-300"}`}>
                  {pt.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-surface-200">Design Intent</label>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI suggests
            </span>
          </div>
          <textarea
            value={userIntent}
            onChange={(e) => setUserIntent(e.target.value)}
            placeholder="e.g. Dark theme with neon accents"
            rows={2}
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
        </div>
      </div>
    </div>
  );
}