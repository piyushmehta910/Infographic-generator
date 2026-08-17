"use client";

import React from "react";
import { Settings, X, AlertCircle } from "lucide-react";
import { useAIStore } from "@/stores/aiStore";
import { AI_PROVIDERS } from "@/lib/constants";

interface ProviderSettingsProps {
  open: boolean;
  onClose: () => void;
}

export default function ProviderSettings({ open, onClose }: ProviderSettingsProps) {
  const { providers, activeProvider, setProvider, setActiveProvider } = useAIStore();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-navy-900 border border-white/10 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-400" /> Settings
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5 text-surface-400" />
          </button>
        </div>
        <div className="space-y-5">
          <div className="bg-brand-900/20 rounded-xl p-4 border border-brand-400/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-brand-300 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-brand-200">
                  API Keys stored locally in your browser only.
                </p>
                <p className="text-xs text-brand-300/70 mt-0.5">Never sent to our servers.</p>
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-surface-200 block mb-2">AI Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveProvider(p.id)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium border-2 transition-all ${
                    activeProvider === p.id
                      ? "border-brand-400 bg-brand-900/30 text-white"
                      : "border-white/10 text-surface-400 hover:border-white/20"
                  }`}
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
                  <label className="text-sm font-medium text-surface-200 block mb-1.5">API Key</label>
                  <input
                    type="password"
                    value={provider.apiKey}
                    onChange={(e) => setProvider({ ...provider, apiKey: e.target.value })}
                    placeholder={`Enter your ${provider.name} API key...`}
                    className="w-full px-4 py-3 bg-navy-950 border border-white/10 rounded-xl text-sm font-mono text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <a
                    href={AI_PROVIDERS.find((p) => p.id === provider.id)?.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-400 hover:text-brand-300 mt-1.5 inline-block"
                  >
                    Get your API key →
                  </a>
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-200 block mb-1.5">Model</label>
                  <select
                    value={provider.model}
                    onChange={(e) => setProvider({ ...provider, model: e.target.value })}
                    className="w-full px-4 py-3 bg-navy-950 border border-white/10 rounded-xl text-sm text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  >
                    {(AI_PROVIDERS.find((p) => p.id === provider.id)?.models || []).map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-surface-200 block mb-1.5">
                      Temperature: {provider.temperature}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={provider.temperature}
                      onChange={(e) => setProvider({ ...provider, temperature: parseFloat(e.target.value) })}
                      className="w-full accent-brand-400"
                    />
                    <div className="flex justify-between text-xs text-surface-500">
                      <span>Precise</span>
                      <span>Creative</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-surface-200 block mb-1.5">
                      Max Tokens: {provider.maxTokens}
                    </label>
                    <input
                      type="range"
                      min="256"
                      max="4096"
                      step="256"
                      value={provider.maxTokens}
                      onChange={(e) => setProvider({ ...provider, maxTokens: parseInt(e.target.value) })}
                      className="w-full accent-brand-400"
                    />
                    <div className="flex justify-between text-xs text-surface-500">
                      <span>256</span>
                      <span>4096</span>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-brand-gradient text-white rounded-xl font-semibold hover:brightness-110 transition-all"
        >
          Done
        </button>
      </div>
    </div>
  );
}