'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Layout, Palette, Download, Image, Type, Settings,
  Undo2, Redo2, ZoomIn, ZoomOut, Grid3X3, Grid3x3,
  PanelLeft, PanelRight, Plus, Trash2, Copy, RotateCcw,
  ArrowLeft, Save, FileText, Lightbulb, Upload, Link,
  Check, X, AlertCircle, Loader2, Maximize2, Minimize2,
  Menu, ChevronLeft, ChevronRight, Sun, Moon, Eye,
  FileDown, Code, FileJson, FileImage, Sigma, AlignCenter,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEditorStore } from '@/stores/editorStore';
import { useTemplateStore } from '@/stores/templateStore';
import { useAIStore } from '@/stores/aiStore';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { TemplateRenderer } from '@/components/templates/TemplateRenderer';
import { generateContent } from '@/services/ai/provider';
import { BUILT_IN_TEMPLATES, getTemplateById, getTheme, getAspectRatio } from '@/services/template/templateEngine';
import { THEMES, ASPECT_RATIOS, FONTS, AI_PROVIDERS } from '@/lib/constants';
import { InfographicContent, AIProviderConfig, AIGenerationRequest, ThemeId, AspectRatioId, FontId } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Stores
  const {
    content, settings, editor, isGenerating,
    setContent, setSettings, setMode, setZoom, selectElement,
    toggleGrid, toggleSnapToGrid, undo, redo, pushHistory, reset,
  } = useEditorStore();

  const {
    templates, selectedTemplate, selectedAspectRatio, selectedTheme,
    setTemplates, selectTemplate, setAspectRatio, setTheme,
  } = useTemplateStore();

  const {
    providers, activeProvider, setProvider, setActiveProvider, getActiveConfig,
  } = useAIStore();

  const { projects, addProject, setCurrentProject } = useProjectStore();
  const { sidebarOpen, toggleSidebar, showToast } = useUIStore();

  // Local states
  const [inputMode, setInputMode] = useState<'text' | 'idea' | 'image' | 'image-url'>('text');
  const [textInput, setTextInput] = useState('');
  const [ideaInput, setIdeaInput] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editableTitle, setEditableTitle] = useState('');
  const [editableSubtitle, setEditableSubtitle] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [showMobileProperties, setShowMobileProperties] = useState(false);

  // Initialize templates
  useEffect(() => {
    setTemplates(BUILT_IN_TEMPLATES);
    selectTemplate(BUILT_IN_TEMPLATES[0]);
  }, []);

  // Sync editable fields
  useEffect(() => {
    if (content) {
      setEditableTitle(content.title);
      setEditableSubtitle(content.subtitle);
    }
  }, [content]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobileViewport) {
      useUIStore.setState({ sidebarOpen: false });
      setShowMobileProperties(false);
      return;
    }

    useUIStore.setState({ sidebarOpen: true });
    setShowMobileProperties(false);
  }, [isMobileViewport]);

  // AI Generation
  const handleGenerate = useCallback(async () => {
    const activeConfig = getActiveConfig();
    if (!activeConfig?.apiKey) {
      showToast({ type: 'error', title: 'API Key Required', message: 'Please configure your AI provider API key in Settings.' });
      setShowSettings(true);
      return;
    }

    if (inputMode === 'text' && !textInput.trim()) {
      showToast({ type: 'error', title: 'Input Required', message: 'Please enter some text content.' });
      return;
    }

    if (inputMode === 'idea' && !ideaInput.trim()) {
      showToast({ type: 'error', title: 'Input Required', message: 'Please enter an idea.' });
      return;
    }

    if (inputMode === 'image-url' && !imageUrlInput.trim()) {
      showToast({ type: 'error', title: 'Input Required', message: 'Please enter an image URL.' });
      return;
    }

    setMode('generating');
    useEditorStore.getState().setGenerating(true);

    const request: AIGenerationRequest = {
      input: inputMode === 'text' ? textInput : inputMode === 'idea' ? ideaInput : imageUrlInput,
      inputType: inputMode,
      templateId: selectedTemplate?.id,
      aspectRatio: selectedAspectRatio,
      theme: selectedTheme,
      font: settings.fontFamily as FontId || 'inter',
    };

    try {
      const result = await generateContent(
        request,
        activeConfig.apiKey,
        activeConfig.id,
        activeConfig.model,
        activeConfig.temperature,
        activeConfig.maxTokens
      );

      if (result.success && result.content) {
        setContent(result.content);
        setMode('editing');
        pushHistory('Generated infographic');
        showToast({ type: 'success', title: 'Infographic Generated!', message: `Completed in ${(result.processingTime || 0) / 1000}s` });
      } else {
        showToast({ type: 'error', title: 'Generation Failed', message: result.error || 'Unknown error' });
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error', message: error instanceof Error ? error.message : 'Failed to generate' });
    } finally {
      useEditorStore.getState().setGenerating(false);
    }
  }, [inputMode, textInput, ideaInput, imageUrlInput, selectedTemplate, selectedAspectRatio, selectedTheme, settings]);

  // Update content from editor
  const updateTitle = useCallback((newTitle: string) => {
    setEditableTitle(newTitle);
    if (content) {
      const updated = { ...content, title: newTitle };
      setContent(updated);
    }
  }, [content, setContent]);

  const updateSubtitle = useCallback((newSubtitle: string) => {
    setEditableSubtitle(newSubtitle);
    if (content) {
      const updated = { ...content, subtitle: newSubtitle };
      setContent(updated);
    }
  }, [content, setContent]);

  // Export functions
  const exportAsPNG = useCallback(async () => {
    const canvas = document.getElementById('infographic-canvas');
    if (!canvas) return;
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(canvas, { quality: 1, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${content?.title || 'infographic'}.png`;
      link.href = dataUrl;
      link.click();
      showToast({ type: 'success', title: 'Exported as PNG' });
    } catch {
      showToast({ type: 'error', title: 'Export Failed' });
    }
  }, [content]);

  const exportAsSVG = useCallback(async () => {
    const canvas = document.getElementById('infographic-canvas');
    if (!canvas) return;
    try {
      const { toSvg } = await import('html-to-image');
      const dataUrl = await toSvg(canvas, { quality: 1 });
      const link = document.createElement('a');
      link.download = `${content?.title || 'infographic'}.svg`;
      link.href = dataUrl;
      link.click();
      showToast({ type: 'success', title: 'Exported as SVG' });
    } catch {
      showToast({ type: 'error', title: 'Export Failed' });
    }
  }, [content]);

  const exportAsJSON = useCallback(() => {
    if (!content) return;
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `${content.title || 'infographic'}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    showToast({ type: 'success', title: 'Exported as JSON' });
  }, [content]);

  // Save project
  const handleSave = useCallback(() => {
    if (!content || !selectedTemplate) return;
    const project = {
      id: crypto.randomUUID(),
      name: content.title || 'Untitled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content,
      templateId: selectedTemplate.id,
      theme: selectedTheme,
      aspectRatio: selectedAspectRatio,
      settings,
      tags: [],
    };
    addProject(project);
    setCurrentProject(project);
    showToast({ type: 'success', title: 'Project Saved!' });
  }, [content, selectedTemplate, selectedTheme, selectedAspectRatio, settings]);

  const theme = getTheme(selectedTheme);
  const aspectRatio = getAspectRatio(selectedAspectRatio);

  const showPropertiesPanel = content && (!isMobileViewport || showMobileProperties);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Toolbar */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-2 sm:px-4 gap-2 sm:gap-3 flex-shrink-0 z-20">
        {isMobileViewport && (
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Open controls"
          >
            <Menu className="w-4 h-4 text-gray-600" />
          </button>
        )}

        <button
          onClick={() => router.push('/')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            InfoGraphic AI
          </span>
        </div>

        <div className="w-px h-6 bg-gray-200 hidden sm:block" />

        {/* Undo/Redo */}
        <button onClick={undo} className="hidden sm:block p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Undo">
          <Undo2 className="w-4 h-4 text-gray-600" />
        </button>
        <button onClick={redo} className="hidden sm:block p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Redo">
          <Redo2 className="w-4 h-4 text-gray-600" />
        </button>

        <div className="w-px h-6 bg-gray-200 hidden sm:block" />

        {/* Zoom */}
        <button onClick={() => setZoom(editor.zoom - 10)} className="hidden sm:block p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ZoomOut className="w-4 h-4 text-gray-600" />
        </button>
        <span className="hidden sm:block text-xs text-gray-500 w-10 text-center">{editor.zoom}%</span>
        <button onClick={() => setZoom(editor.zoom + 10)} className="hidden sm:block p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ZoomIn className="w-4 h-4 text-gray-600" />
        </button>

        <div className="w-px h-6 bg-gray-200 hidden sm:block" />

        {/* Grid Toggles */}
        <button
          onClick={toggleGrid}
          className={`hidden sm:block p-1.5 rounded-lg transition-colors ${editor.showGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
          title="Toggle Grid"
        >
          <Grid3X3 className="w-4 h-4" />
        </button>
        <button
          onClick={toggleSnapToGrid}
          className={`hidden sm:block p-1.5 rounded-lg transition-colors ${editor.snapToGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
          title="Snap to Grid"
        >
          <Grid3x3 className="w-4 h-4" />
        </button>

        <div className="flex-1" />

        {/* Actions */}
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="px-2 sm:px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
        >
          <span className="hidden sm:inline">Templates</span>
          <Layout className="w-4 h-4 sm:hidden" />
        </button>

        <button
          onClick={() => setShowExport(!showExport)}
          className="px-2 sm:px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
        >
          <span className="hidden sm:inline">Export</span>
          <Download className="w-4 h-4 sm:hidden" />
        </button>

        <button
          onClick={handleSave}
          className="hidden sm:block px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Save
        </button>

        {content && isMobileViewport && (
          <button
            onClick={() => setShowMobileProperties(true)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit content"
          >
            <Type className="w-4 h-4 text-gray-600" />
          </button>
        )}

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4 text-gray-600" />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar - Input & Controls */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={isMobileViewport ? { x: -24, opacity: 0 } : { width: 0, opacity: 0 }}
              animate={isMobileViewport ? { x: 0, opacity: 1 } : { width: 380, opacity: 1 }}
              exit={isMobileViewport ? { x: -24, opacity: 0 } : { width: 0, opacity: 0 }}
              className={`bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0 ${
                isMobileViewport
                  ? 'fixed top-14 left-0 bottom-0 z-40 w-[90vw] max-w-sm shadow-2xl'
                  : ''
              }`}
            >
              <div className="p-4 space-y-4">
                {/* Input Mode Tabs */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  {[
                    { id: 'text' as const, icon: FileText, label: 'Text' },
                    { id: 'idea' as const, icon: Lightbulb, label: 'Idea' },
                    { id: 'image' as const, icon: Upload, label: 'Image' },
                    { id: 'image-url' as const, icon: Link, label: 'URL' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setInputMode(mode.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        inputMode === mode.id
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <mode.icon className="w-3.5 h-3.5" />
                      {mode.label}
                    </button>
                  ))}
                </div>

                {/* Input Areas */}
                {inputMode === 'text' && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Paste your content</label>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Paste notes, articles, reports, blog posts, research, scripts..."
                      rows={8}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-400">AI will clean, structure, and enhance your content</p>
                  </div>
                )}

                {inputMode === 'idea' && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Describe your idea</label>
                    <textarea
                      value={ideaInput}
                      onChange={(e) => setIdeaInput(e.target.value)}
                      placeholder="e.g., Create an infographic explaining climate change..."
                      rows={4}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Benefits of physiotherapy',
                        'How blockchain works',
                        'Renewable energy overview',
                        'Remote work statistics',
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setIdeaInput(suggestion)}
                          className="px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {inputMode === 'image' && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Upload an image</label>
                    <div
                      className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">Drop an image here or click to browse</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 10MB</p>
                      <input id="image-upload" type="file" accept="image/*" className="hidden" />
                    </div>
                  </div>
                )}

                {inputMode === 'image-url' && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Image URL</label>
                    <input
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400">AI will analyze the image for content and style</p>
                  </div>
                )}

                {/* Template & Aspect Ratio Selectors */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Template</label>
                    <select
                      value={selectedTemplate?.id || ''}
                      onChange={(e) => {
                        const tpl = getTemplateById(e.target.value);
                        if (tpl) selectTemplate(tpl);
                      }}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {BUILT_IN_TEMPLATES.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Aspect Ratio</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {Object.entries(ASPECT_RATIOS).map(([key, ratio]) => (
                        <button
                          key={key}
                          onClick={() => setAspectRatio(ratio.id)}
                          className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            selectedAspectRatio === ratio.id
                              ? 'border-blue-500 bg-blue-50 text-blue-600'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Theme</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {Object.entries(THEMES).map(([key, t]) => (
                        <button
                          key={key}
                          onClick={() => setTheme(t.id)}
                          className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            selectedTheme === t.id
                              ? 'border-blue-500 bg-blue-50 text-blue-600'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Infographic
                    </>
                  )}
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {isMobileViewport && sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="fixed inset-0 top-14 bg-black/30 z-30"
            aria-label="Close controls"
          />
        )}

        {/* Toggle Sidebar Button */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-r-lg p-1.5 shadow-sm hover:bg-gray-50"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Canvas Area */}
        <main className="flex-1 overflow-auto bg-gray-100 flex items-start sm:items-center justify-center p-3 sm:p-8 relative">
          {/* Grid overlay */}
          {editor.showGrid && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
          )}

          {content ? (
            <div
              ref={canvasRef}
              className="shadow-2xl rounded-lg overflow-hidden max-w-full"
            >
              <TemplateRenderer
                content={content}
                theme={theme}
                aspectRatio={aspectRatio}
                settings={settings}
                templateId={selectedTemplate?.id || 'modern'}
                onElementClick={(id) => {
                  selectElement(id);
                  if (id === 'title' || id === 'subtitle') setActiveSection(id);
                }}
              />
            </div>
          ) : (
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Create Your Infographic</h2>
              <p className="text-gray-500 leading-relaxed">
                Enter your content in the panel on the left, select a template and theme, then click Generate.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {['1. Paste Content', '2. Choose Template', '3. Generate'].map((step) => (
                  <div key={step} className="text-sm text-gray-400 bg-white rounded-xl p-3 border border-gray-100">
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Right Properties Panel */}
        <AnimatePresence>
          {showPropertiesPanel && (
            <motion.aside
              initial={isMobileViewport ? { y: 30, opacity: 0 } : { width: 0, opacity: 0 }}
              animate={isMobileViewport ? { y: 0, opacity: 1 } : { width: 320, opacity: 1 }}
              exit={isMobileViewport ? { y: 30, opacity: 0 } : { width: 0, opacity: 0 }}
              className={`bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0 ${
                isMobileViewport
                  ? 'fixed left-0 right-0 bottom-0 z-50 max-h-[78vh] rounded-t-2xl border-t shadow-2xl'
                  : ''
              }`}
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Edit Content
                  </h3>
                  {isMobileViewport && (
                    <button
                      onClick={() => setShowMobileProperties(false)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>

                {/* Title Edit */}
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Title</label>
                  <input
                    value={editableTitle}
                    onChange={(e) => updateTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Subtitle Edit */}
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Subtitle</label>
                  <input
                    value={editableSubtitle}
                    onChange={(e) => updateSubtitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Sections */}
                {content.sections.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-2">Sections</label>
                    {content.sections.map((section) => (
                      <div key={section.id} className="mb-2 p-2 bg-gray-50 rounded-lg text-sm">
                        <div className="font-medium text-gray-700">{section.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{section.content.substring(0, 80)}...</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Layout Controls */}
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
                    <Layout className="w-4 h-4" />
                    Layout
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Alignment</label>
                      <div className="flex gap-1">
                        {['left', 'center', 'right', 'justify'].map((a) => (
                          <button
                            key={a}
                            onClick={() => setSettings({ alignment: a as any })}
                            className={`flex-1 px-2 py-1.5 rounded text-xs font-medium border ${
                              settings.alignment === a ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600'
                            }`}
                          >
                            {a.charAt(0).toUpperCase() + a.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Spacing</label>
                      <div className="flex gap-1">
                        {['compact', 'comfortable', 'spacious'].map((s) => (
                          <button
                            key={s}
                            onClick={() => setSettings({ spacing: s as any })}
                            className={`flex-1 px-2 py-1.5 rounded text-xs font-medium border ${
                              settings.spacing === s ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600'
                            }`}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Font</label>
                      <select
                        value={settings.fontFamily}
                        onChange={(e) => setSettings({ fontFamily: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      >
                        {FONTS.map((f) => (
                          <option key={f.id} value={f.name}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* CTA Edit */}
                {content.callToAction && (
                  <div className="border-t border-gray-100 pt-4">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Call to Action</label>
                    <input
                      value={content.callToAction}
                      onChange={(e) => {
                        const updated = { ...content, callToAction: e.target.value };
                        setContent(updated);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {isMobileViewport && showPropertiesPanel && (
          <button
            onClick={() => setShowMobileProperties(false)}
            className="fixed inset-0 bg-black/30 z-40"
            aria-label="Close properties panel"
          />
        )}
      </div>

      {/* Export Panel Modal */}
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
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Infographic
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={exportAsPNG}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors text-center"
                >
                  <FileImage className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="font-medium text-gray-900">PNG</div>
                  <div className="text-xs text-gray-500">High quality image</div>
                </button>

                <button
                  onClick={exportAsSVG}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 transition-colors text-center"
                >
                  <Code className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="font-medium text-gray-900">SVG</div>
                  <div className="text-xs text-gray-500">Vector format</div>
                </button>

                <button className="p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 transition-colors text-center">
                  <FileDown className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="font-medium text-gray-900">PDF</div>
                  <div className="text-xs text-gray-500">Document format</div>
                </button>

                <button
                  onClick={exportAsJSON}
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

      {/* Template Gallery Modal */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowTemplates(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full mx-4 shadow-2xl border border-gray-200 max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Layout className="w-5 h-5 text-blue-600" />
                    Template Gallery
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Choose a template for your infographic</p>
                </div>
                <button onClick={() => setShowTemplates(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Category Filter */}
              <div className="px-6 py-3 border-b border-gray-100 flex gap-2 overflow-x-auto">
                {['all', 'business', 'marketing', 'education', 'technology', 'medical', 'timeline', 'comparison', 'startup'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              {/* Template Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {BUILT_IN_TEMPLATES.filter(t => selectedCategory === 'all' || t.category === selectedCategory).map((template) => {
                    const isSelected = selectedTemplate?.id === template.id;
                    const colors = [
                      'from-blue-500 to-purple-600',
                      'from-emerald-500 to-teal-600',
                      'from-orange-500 to-red-500',
                      'from-pink-500 to-rose-600',
                      'from-cyan-500 to-blue-600',
                      'from-violet-500 to-indigo-600',
                      'from-green-500 to-emerald-600',
                      'from-yellow-500 to-orange-500',
                      'from-indigo-500 to-purple-600',
                    ];
                    const colorIndex = BUILT_IN_TEMPLATES.indexOf(template) % colors.length;

                    return (
                      <motion.button
                        key={template.id}
                        whileHover={{ y: -2 }}
                        onClick={() => {
                          selectTemplate(template);
                          setShowTemplates(false);
                          showToast({ type: 'success', title: `Selected: ${template.name}` });
                        }}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all text-left ${
                          isSelected
                            ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                            : 'border-gray-200 hover:border-gray-300 shadow-sm'
                        }`}
                      >
                        {/* Preview */}
                        <div className={`h-32 bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center`}>
                          <div className="text-white text-center px-4">
                            <div className="text-lg font-bold">{template.name}</div>
                            <div className="text-xs opacity-80 mt-1">{template.description}</div>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </div>
                        {/* Details */}
                        <div className="p-3 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{template.category}</span>
                            <span className="text-xs text-gray-400">v{template.version}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {template.aspectRatios.slice(0, 4).map((ratio) => (
                              <span key={ratio} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-500">
                                {ratio}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel Modal */}
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
              className="bg-white dark:bg-surface-800 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <span>Settings</span>
                </h2>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* AI Provider Configuration */}
              <div className="space-y-5">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">API Keys stored locally</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                        Your API keys are saved in your browser only. They are never sent to our servers.
                        API calls go directly from your browser to your chosen AI provider.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">AI Provider</label>
                  <div className="grid grid-cols-5 gap-2">
                    {providers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setActiveProvider(p.id)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-medium border-2 transition-all ${
                          activeProvider === p.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                            : 'border-gray-200 dark:border-surface-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-surface-500 bg-white dark:bg-surface-800'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {providers.filter(p => p.id === activeProvider).map((provider) => (
                  <React.Fragment key={provider.id}>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          API Key
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={provider.apiKey}
                          onChange={(e) => setProvider({ ...provider, apiKey: e.target.value })}
                          placeholder={`Enter your ${provider.name} API key...`}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-900 border border-gray-300 dark:border-surface-600 rounded-xl text-sm font-mono text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <a
                        href={AI_PROVIDERS.find(p => p.id === provider.id)?.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 mt-1.5 inline-block"
                      >
                        Get your API key →
                      </a>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Model</label>
                      <select
                        value={provider.model}
                        onChange={(e) => setProvider({ ...provider, model: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-900 border border-gray-300 dark:border-surface-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        {(AI_PROVIDERS.find(p => p.id === provider.id)?.models || []).map((model) => (
                          <option key={model.id} value={model.id} className="text-gray-900 dark:text-gray-100">{model.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-gray-50 dark:bg-surface-900 rounded-xl p-4 border border-gray-200 dark:border-surface-600">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Generation Parameters</h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Temperature</label>
                            <span className="text-xs font-mono text-gray-600 dark:text-gray-300 bg-white dark:bg-surface-800 px-2 py-0.5 rounded border border-gray-200 dark:border-surface-600">{provider.temperature}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={provider.temperature}
                            onChange={(e) => setProvider({ ...provider, temperature: parseFloat(e.target.value) })}
                            className="w-full h-2 bg-gray-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>Precise (0)</span>
                            <span>Balanced (1)</span>
                            <span>Creative (2)</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">Max Tokens</label>
                          <input
                            type="number"
                            value={provider.maxTokens}
                            onChange={(e) => setProvider({ ...provider, maxTokens: parseInt(e.target.value) || 4096 })}
                            className="w-full px-4 py-2.5 bg-white dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min={256}
                            max={32000}
                            step={256}
                          />
                        </div>
                      </div>
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
    </div>
  );
}