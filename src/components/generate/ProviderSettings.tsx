"use client";

import React, { useEffect, useRef, useState } from "react";
import { Settings, X, AlertCircle, Plug, Loader2, CheckCircle2, ChevronDown } from "lucide-react";
import { useAIStore } from "@/stores/aiStore";
import { AI_PROVIDERS } from "@/lib/constants";

interface ProviderSettingsProps {
  open: boolean;
  onClose: () => void;
}

export default function ProviderSettings({ open, onClose }: ProviderSettingsProps) {
  const { providers, activeProvider, setProvider, setActiveProvider } = useAIStore();
  const [testing, setTesting] = useState(false);
  const [freeOnly, setFreeOnly] = useState(true);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

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
  }, [activeProvider]);

  if (!open) return null;

  const active = providers.find((p) => p.id === activeProvider);

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

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="provider-settings-title"
        className="bg-navy-900 border border-white/10 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2
            id="provider-settings-title"
            className="text-xl font-bold text-white flex items-center gap-2"
          >
            <Settings className="w-5 h-5 text-brand-400" /> Settings
          </h2>
          <button onClick={onClose} aria-label="Close settings" className="p-2 hover:bg-white/5 rounded-lg">
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
          {active &&
            (active.id === "custom" ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-surface-200 block mb-1.5">Provider Name</label>
                  <input
                    type="text"
                    value={active.name}
                    onChange={(e) => updateCustom("name", e.target.value)}
                    placeholder="My Custom Provider"
                    className="w-full px-4 py-3 bg-navy-950 border border-white/10 rounded-xl text-sm text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-200 block mb-1.5">API Base URL</label>
                  <input
                    type="text"
                    value={active.baseUrl || ""}
                    onChange={(e) => updateCustom("baseUrl", e.target.value)}
                    placeholder="https://api.example.com/v1"
                    className="w-full px-4 py-3 bg-navy-950 border border-white/10 rounded-xl text-sm font-mono text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <p className="text-xs text-surface-500 mt-1">Must end with the API root, e.g. https://openrouter.ai/api/v1</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-200 block mb-1.5">API Key</label>
                  <input
                    type="password"
                    value={active.apiKey}
                    onChange={(e) => updateCustom("apiKey", e.target.value)}
                    placeholder="Enter your API key..."
                    className="w-full px-4 py-3 bg-navy-950 border border-white/10 rounded-xl text-sm font-mono text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-200 block mb-1.5">Model Name</label>
                  <input
                    type="text"
                    value={active.model}
                    onChange={(e) => updateCustom("model", e.target.value)}
                    placeholder="e.g. gpt-4o-mini"
                    className="w-full px-4 py-3 bg-navy-950 border border-white/10 rounded-xl text-sm font-mono text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
                <button
                  onClick={runTest}
                  disabled={testing}
                  className="w-full text-xs inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-md bg-brand-900/40 border border-brand-400/30 text-brand-200 hover:bg-brand-900/60 disabled:opacity-50"
                >
                  {testing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plug className="w-3.5 h-3.5" />
                  )}
                  Test connection
                </button>
                {testResult && (
                  <div
                    className={`text-xs px-3 py-2 rounded-lg border ${
                      testResult.ok
                        ? "bg-emerald-900/20 border-emerald-400/30 text-emerald-300"
                        : "bg-red-900/20 border-red-400/30 text-red-300"
                    }`}
                  >
                    {testResult.ok ? (
                      <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                    )}
                    {testResult.message}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-surface-200 block mb-1.5">
                      Temperature: {active.temperature}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={active.temperature}
                      onChange={(e) => updateCustom("temperature", parseFloat(e.target.value))}
                      className="w-full accent-brand-400"
                    />
                    <div className="flex justify-between text-xs text-surface-500">
                      <span>Precise</span>
                      <span>Creative</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-surface-200 block mb-1.5">
                      Max Tokens: {active.maxTokens}
                    </label>
                    <input
                      type="range"
                      min="256"
                      max="4096"
                      step="256"
                      value={active.maxTokens}
                      onChange={(e) => updateCustom("maxTokens", parseInt(e.target.value))}
                      className="w-full accent-brand-400"
                    />
                    <div className="flex justify-between text-xs text-surface-500">
                      <span>256</span>
                      <span>4096</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              providers
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
                      <button
                        onClick={runTest}
                        disabled={testing}
                        className="ml-3 text-xs inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-900/40 border border-brand-400/30 text-brand-200 hover:bg-brand-900/60 disabled:opacity-50"
                      >
                        {testing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plug className="w-3.5 h-3.5" />
                        )}
                        Test connection
                      </button>
                    </div>
                    {testResult && (
                      <div
                        className={`text-xs px-3 py-2 rounded-lg border ${
                          testResult.ok
                            ? "bg-emerald-900/20 border-emerald-400/30 text-emerald-300"
                            : "bg-red-900/20 border-red-400/30 text-red-300"
                        }`}
                      >
                        {testResult.ok ? (
                          <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                        )}
                        {testResult.message}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium text-surface-200">Model</label>
                        <button
                          type="button"
                          onClick={() => setFreeOnly(!freeOnly)}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                            freeOnly
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                              : "bg-surface-800 text-surface-400 border-white/10"
                          }`}
                        >
                          {freeOnly ? "✓ Showing Free Models Only" : "Show All Models"}
                        </button>
                      </div>
                      <div className="relative">
                        <select
                          value={provider.model}
                          onChange={(e) => setProvider({ ...provider, model: e.target.value })}
                          className="w-full appearance-none px-4 py-3 pr-10 bg-navy-950 border border-white/10 rounded-xl text-sm text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-400"
                          style={{ colorScheme: "dark" }}
                        >
                          {(AI_PROVIDERS.find((p) => p.id === provider.id)?.models || [])
                            .filter((m) => !freeOnly || m.isFree !== false)
                            .map((model) => (
                              <option key={model.id} value={model.id}>
                                {model.name} {model.isFree ? "— 100% Free" : ""}
                              </option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-surface-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                      {(() => {
                        const currentModelInfo = (
                          AI_PROVIDERS.find((p) => p.id === provider.id)?.models || []
                        ).find((m) => m.id === provider.model);
                        return (
                          currentModelInfo?.description && (
                            <p className="text-xs text-surface-400 mt-1.5 leading-relaxed bg-surface-950/60 p-2.5 rounded-lg border border-white/5">
                              <span className="text-brand-300 font-medium">Model Info: </span>
                              {currentModelInfo.description}
                            </p>
                          )
                        );
                      })()}
                      <div className="mt-2 text-[11px] text-surface-400 bg-brand-950/40 border border-brand-500/20 p-2.5 rounded-lg flex items-start gap-2">
                        <span className="text-brand-300 text-xs">🛡️</span>
                        <span>
                          <strong className="text-surface-200">Auto-Switch Failover:</strong> If this model is busy or hits a rate limit, the system automatically tries next free models or backup providers with no interruption.
                        </span>
                      </div>
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
                ))
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