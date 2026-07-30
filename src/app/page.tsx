"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Zap,
  Sparkles,
  Download,
  Layout,
  Palette,
  Image,
  ArrowRight,
  Menu,
  X,
  FileText,
  Wand2,
  Brain,
  Globe,
  Check,
} from "lucide-react";

const features = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "AI-Powered Generation",
    description: "Paste text, describe an idea, or upload an image. AI analyzes, structures, and designs a unique infographic automatically.",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Multiple Input Types",
    description: "Text paste, idea descriptions, image upload (PNG/JPG/WEBP), and image URL analysis. AI extracts key facts and statistics.",
  },
  {
    icon: <Layout className="w-6 h-6" />,
    title: "8 Aspect Ratios",
    description: "Square 1:1, Portrait 4:5, Story 9:16, Landscape 16:9, A4 Portrait/Landscape, Letter, and custom dimensions.",
  },
  {
    icon: <Palette className="w-6 h-6" />,
    title: "Unique Designs Every Time",
    description: "No templates needed. AI creates a completely unique design based on your content and design intent.",
  },
  {
    icon: <Download className="w-6 h-6" />,
    title: "Multiple Export Formats",
    description: "Download as PNG, JPG, PDF, or JSON project file. High-resolution exports ready for any platform.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "5 AI Providers",
    description: "Bring your own API key. Supports OpenAI, Google Gemini, Anthropic Claude, OpenRouter, and Groq. Keys stored locally.",
  },
  {
    icon: <Image className="w-6 h-6" />,
    title: "Image Analysis",
    description: "Upload an image or paste a URL. AI analyzes colors, subject, objects, and layout to generate matching content.",
  },
  {
    icon: <Wand2 className="w-6 h-6" />,
    title: "Design Intent Control",
    description: "Tell AI how you want it to look. 'Dark theme with neon accents' or 'clean minimal design' — AI follows your vision.",
  },
];

const steps = [
  { num: "1", title: "Input Content", desc: "Paste text, upload an image, or describe an idea", icon: "📝" },
  { num: "2", title: "Choose Settings", desc: "Select purpose, aspect ratio, and design intent", icon: "⚙️" },
  { num: "3", title: "AI Generates", desc: "AI analyzes, structures, and designs your infographic", icon: "🤖" },
  { num: "4", title: "Download", desc: "Export as PNG, JPG, PDF, or JSON", icon: "📥" },
];

const faqs = [
  {
    q: "How does the AI generate infographics?",
    a: "AI analyzes your content, structures it into clean JSON, then designs and generates a complete HTML/CSS infographic tailored to your content and intent. Every design is unique — no templates needed.",
  },
  {
    q: "Do I need an API key?",
    a: "Yes, you bring your own API key from your preferred AI provider (OpenAI, Gemini, Claude, OpenRouter, or Groq). Keys are stored locally in your browser for security.",
  },
  {
    q: "What formats can I export?",
    a: "Export as PNG, JPG, PDF, or JSON Project. All exports preserve high resolution.",
  },
  {
    q: "Do I need to choose a template?",
    a: "No! AI generates a unique design every time based on your content and purpose. Just describe what you want to create, and AI handles the design automatically.",
  },
  {
    q: "Is my data secure?",
    a: "Your API keys stay in your browser. Content is sent directly to your chosen AI provider. We never store your content on our servers.",
  },
  {
    q: "Can I control the design style?",
    a: "Yes! Use the Design Intent field to tell AI how you want it to look. For example: 'dark theme with neon accents' or 'clean minimal with bold statistics'.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                InfoGraphic AI
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Features</a>
              <a href="#how" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">How It Works</a>
              <a href="#faq" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">FAQ</a>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all"
              >
                Get Started
              </button>
            </div>
            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-100"
            >
              <div className="px-4 py-4 space-y-4">
                <a href="#features" className="block text-slate-600 py-2">Features</a>
                <a href="#how" className="block text-slate-600 py-2">How It Works</a>
                <a href="#faq" className="block text-slate-600 py-2">FAQ</a>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-medium"
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-sm text-blue-600 font-medium mb-8">
              <Zap className="w-4 h-4" />
              AI-Powered Infographic Generator
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-slate-900 leading-tight mb-6">
              Turn Ideas Into
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                Stunning Infographics
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Transform text, ideas, and images into beautiful, professional infographics.
              AI generates unique designs — no templates needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-lg font-semibold hover:shadow-xl hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                Create Your First Infographic
                <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="https://github.com/piyushmehta910/Infographic-generator/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 border-2 border-slate-200 text-slate-700 rounded-full text-lg font-semibold hover:border-slate-300 transition-all"
              >
                📱 Download App
              </a>
            </div>
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {[
                { value: "∞", label: "AI Designs" },
                { value: "5", label: "AI Providers" },
                { value: "4", label: "Export Formats" },
                { value: "8", label: "Aspect Ratios" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Create professional infographics in 4 simple steps
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100"
              >
                <div className="text-4xl mb-4">{step.icon}</div>
                <div className="text-sm font-bold text-blue-600 mb-2">Step {step.num}</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Powerful Features</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to create stunning infographics with AI
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">FAQ</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <button
                  className="w-full px-6 py-4 text-left flex justify-between items-center gap-4"
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                >
                  <span className="font-medium text-slate-900">{faq.q}</span>
                  <motion.span animate={{ rotate: activeFaq === index ? 180 : 0 }} className="text-slate-400 flex-shrink-0">▼</motion.span>
                </button>
                <AnimatePresence>
                  {activeFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-4 text-slate-600 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 rounded-3xl p-12 md:p-20 text-white">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">Ready to Create?</h2>
            <p className="text-lg sm:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Start creating custom infographics with AI. No design skills required.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-8 py-4 bg-white text-slate-900 rounded-full text-lg font-semibold hover:shadow-xl transition-all inline-flex items-center justify-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>© 2026 InfoGraphic AI. Built with Next.js, TypeScript, and Tailwind CSS.</p>
        </div>
      </footer>
    </div>
  );
}