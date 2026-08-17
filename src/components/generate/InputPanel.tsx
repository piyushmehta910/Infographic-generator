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
  { id: "data", label: "Data (CSV)", icon: <Upload className="w-4 h-4" /> },
];

export default function InputPanel(p: InputPanelProps) {
  const {
    input, setInput, inputType, setInputType, imageUrl, setImageUrl,
    imageFile, setImageFile, purpose, setPurpose, userIntent, setUserIntent,
    onGenerateClick, isGenerating,
  } = p;

  const canGenerate = Boolean(input) && input.trim().length > 0;
  return (
    <div className="w-full md:w-72 lg:w-76 xl:w-80 flex-shrink-0 flex flex-col h-screen border-r border-white/5 bg-surface-900/80">
      <div className="p-6 flex-1 overflow-y-hidden">
        <div>
          <h1 className="text-xl font-display font-bold text-white mb-1">Create Infographic</h1>
          <p className="text-sm text-surface-400">AI generates unique designs based on your content.</p>
        </div>

        <div className="flex gap-1 bg-surface-800/60 p-1 rounded-xl">
          {INPUT_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setInputType(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium touch-target transition-all ${
                inputType === t.id ? "bg-brand-gradient text-white shadow" : "text-surface-300 hover:text-white"
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
        {inputType === "text" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-surface-200">Your Content</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste a blog post, article, or describe your idea..."
              rows={7}
              maxLength={8000}
              className="w-full px-4 py-3 rounded-xl bg-surface-800/60 border border-white/10 text-surface-100 placeholder-surface-400/70 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>
        )}

        {inputType === "url" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-surface-200">Article URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full h-12 px-4 rounded-xl bg-surface-800/60 border border-white/10 text-surface-100 placeholder-surface-400/70 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <p className="text-xs text-surface-400">We fetch and summarize the page content client-side.</p>
          </div>
        )}
        {inputType === "image" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-surface-200">Upload Image</label>
            <label className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-surface-600 bg-surface-800/40 cursor-pointer hover:border-brand-400 transition-colors">
              <Upload className="w-6 h-6 text-surface-400 mb-2" />
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-surface-200">Paste CSV data</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={"label,value&#10;Revenue,2.1M&#10;Costs,1.2M"}
              rows={6}
              className="w-full px-4 py-3 rounded-xl bg-surface-800/60 border border-white/10 font-mono text-xs text-surface-100 placeholder-surface-400/70 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
            <p className="text-xs text-surface-400">We auto-detect columns and map them to charts.</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-surface-200">Purpose</label>
          <div className="grid grid-cols-3 gap-2">
            {PURPOSES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPurpose(p.id)}
                className={`p-2.5 rounded-xl text-xs border-2 transition-all text-center touch-target ${
                  purpose === p.id
                    ? "border-brand-400 bg-brand-900/30 text-white"
                    : "border-surface-600 hover:border-surface-500 text-surface-300"
                }`}
              >
                <div className="text-lg mb-0.5">{p.icon}</div>
                <div className="font-medium">{p.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-surface-200">
              Design Intent <span className="text-surface-500 text-xs">(optional)</span>
            </label>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI suggests
            </span>
          </div>
          <textarea
            value={userIntent}
            onChange={(e) => setUserIntent(e.target.value)}
            placeholder="e.g. Dark theme with neon accents, or leave empty for AI"
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-surface-800/60 border border-white/10 text-surface-100 placeholder-surface-400/70 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
          />
        </div>

        <div className="pt-2">
          <Button
            variant="primary"
            className="w-full"
            size="lg"
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
