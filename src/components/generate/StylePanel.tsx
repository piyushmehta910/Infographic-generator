"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface StylePanelProps {
  onRegenerate: () => void;
  isGenerating: boolean;
  hasContent: boolean;
}

export default function StylePanel(p: StylePanelProps) {
  const { onRegenerate, isGenerating, hasContent } = p;

  return (
    <aside className="hidden xl:block w-72 xl:w-80 flex-shrink-0 overflow-y-auto border-l border-white/5 bg-surface-900/60">
      <div className="p-5 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-white">Design</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
            disabled={!hasContent || isGenerating}
            title="Regenerate layout"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
            <span className="hidden xl:inline ml-1">Regenerate</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}